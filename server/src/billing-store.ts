import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

type UsageType = 'video_generation' | 'image_factory';
type FeatureType = 'image_factory' | 'ecommerce_video';
type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  sort_order: number;
  is_active: boolean;
}

interface CreditOrder {
  id: string;
  order_no: string;
  user_id: string;
  package_id: string;
  credits: number;
  amount: number;
  status: OrderStatus;
  wechat_pay_url: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreditUsageRecord {
  id: string;
  user_id: string;
  credits: number;
  usage_type: UsageType;
  description: string | null;
  created_at: string;
}

interface UserWallet {
  user_id: string;
  credits_balance: number;
  image_factory_free_used: number;
  ecommerce_video_free_used: number;
}

interface BillingStoreData {
  packages: CreditPackage[];
  orders: CreditOrder[];
  usage: CreditUsageRecord[];
  wallets: UserWallet[];
}

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'billing-store.json');
const IMAGE_FACTORY_LIMIT = 12;
const ECOMMERCE_VIDEO_LIMIT = 7;
const IMAGE_FACTORY_CREDITS_COST = 10;
const ECOMMERCE_VIDEO_CREDITS_COST = 20;

function defaultPackages(): CreditPackage[] {
  return [
    { id: 'starter', name: '入门包', credits: 100, price: 19.9, sort_order: 1, is_active: true },
    { id: 'standard', name: '标准包', credits: 300, price: 49.9, sort_order: 2, is_active: true },
    { id: 'pro', name: '进阶包', credits: 800, price: 99.9, sort_order: 3, is_active: true },
  ];
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BillingStoreData>;
    return {
      packages: Array.isArray(parsed.packages) && parsed.packages.length > 0 ? parsed.packages : defaultPackages(),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      usage: Array.isArray(parsed.usage) ? parsed.usage : [],
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
    } satisfies BillingStoreData;
  } catch {
    const initial: BillingStoreData = {
      packages: defaultPackages(),
      orders: [],
      usage: [],
      wallets: [],
    };
    await writeFile(dataFile, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function saveStore(data: BillingStoreData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

async function ensureWallet(store: BillingStoreData, userId: string) {
  let wallet = store.wallets.find((item) => item.user_id === userId);
  if (!wallet) {
    wallet = {
      user_id: userId,
      credits_balance: 100,
      image_factory_free_used: 0,
      ecommerce_video_free_used: 0,
    };
    store.wallets.push(wallet);
    await saveStore(store);
  }
  return wallet;
}

function buildOrderNo() {
  return `CR${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}

export async function getCreditPackagesList() {
  const store = await ensureStore();
  return store.packages.filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export async function getCreditsBalance(userId: string) {
  const store = await ensureStore();
  const wallet = await ensureWallet(store, userId);
  return wallet.credits_balance;
}

export async function createOrder(userId: string, packageId: string) {
  const store = await ensureStore();
  const wallet = await ensureWallet(store, userId);
  const pkg = store.packages.find((item) => item.id === packageId && item.is_active);
  if (!pkg) {
    throw new Error('Credit package not found.');
  }

  const timestamp = new Date().toISOString();
  const order: CreditOrder = {
    id: randomUUID(),
    order_no: buildOrderNo(),
    user_id: userId,
    package_id: pkg.id,
    credits: pkg.credits,
    amount: pkg.price,
    status: 'paid',
    wechat_pay_url: null,
    payment_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  store.orders.push(order);
  wallet.credits_balance += pkg.credits;
  await saveStore(store);

  return {
    orderNo: order.order_no,
    payUrl: '',
  };
}

export async function getOrderDetail(orderNo: string) {
  const store = await ensureStore();
  const order = store.orders.find((item) => item.order_no === orderNo);
  if (!order) {
    return null;
  }

  const pkg = store.packages.find((item) => item.id === order.package_id);
  return {
    ...order,
    credit_packages: pkg
      ? {
          name: pkg.name,
          credits: pkg.credits,
          price: pkg.price,
        }
      : {
          name: '',
          credits: order.credits,
          price: order.amount,
        },
  };
}

export async function getCreditUsageHistory(userId: string, limit = 50) {
  const store = await ensureStore();
  return store.usage
    .filter((item) => item.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

function featureConfig(feature: FeatureType) {
  return feature === 'image_factory'
    ? {
        limit: IMAGE_FACTORY_LIMIT,
        cost: IMAGE_FACTORY_CREDITS_COST,
        usageField: 'image_factory_free_used' as const,
        usageType: 'image_factory' as UsageType,
        successMessage: '图片工厂使用成功',
      }
    : {
        limit: ECOMMERCE_VIDEO_LIMIT,
        cost: ECOMMERCE_VIDEO_CREDITS_COST,
        usageField: 'ecommerce_video_free_used' as const,
        usageType: 'video_generation' as UsageType,
        successMessage: '视频生成使用成功',
      };
}

export async function checkAndConsumeFeatureUsage(userId: string, feature: FeatureType) {
  const store = await ensureStore();
  const wallet = await ensureWallet(store, userId);
  const config = featureConfig(feature);
  const used = wallet[config.usageField];
  const remainingFree = Math.max(0, config.limit - used);

  if (remainingFree > 0) {
    wallet[config.usageField] += 1;
    await saveStore(store);
    return {
      success: true,
      message: config.successMessage,
      remaining_free: Math.max(0, config.limit - wallet[config.usageField]),
      credits_balance: wallet.credits_balance,
      consumed_type: 'free',
    };
  }

  if (wallet.credits_balance < config.cost) {
    return {
      success: false,
      message: '积分不足，请先充值',
      remaining_free: 0,
      credits_balance: wallet.credits_balance,
      consumed_type: '',
    };
  }

  wallet.credits_balance -= config.cost;
  store.usage.push({
    id: randomUUID(),
    user_id: userId,
    credits: config.cost,
    usage_type: config.usageType,
    description: feature === 'image_factory' ? '图片工厂生成' : '电商视频生成',
    created_at: new Date().toISOString(),
  });
  await saveStore(store);

  return {
    success: true,
    message: config.successMessage,
    remaining_free: 0,
    credits_balance: wallet.credits_balance,
    consumed_type: 'credits',
  };
}

export async function getUsageSummary(userId: string) {
  const store = await ensureStore();
  const wallet = await ensureWallet(store, userId);

  return {
    image_factory_remaining: Math.max(0, IMAGE_FACTORY_LIMIT - wallet.image_factory_free_used),
    image_factory_limit: IMAGE_FACTORY_LIMIT,
    ecommerce_video_remaining: Math.max(0, ECOMMERCE_VIDEO_LIMIT - wallet.ecommerce_video_free_used),
    ecommerce_video_limit: ECOMMERCE_VIDEO_LIMIT,
    credits_balance: wallet.credits_balance,
  };
}

export async function getUserStatisticsSummary(userId: string) {
  const store = await ensureStore();
  const productStoreRaw = await readFile(path.join(dataDir, 'products.json'), 'utf8').catch(() => '{"products":[]}');
  const productStore = JSON.parse(productStoreRaw) as { products?: Array<{ user_id: string }> };
  const usage = store.usage.filter((item) => item.user_id === userId);

  return {
    productCount: (productStore.products || []).filter((item) => item.user_id === userId).length,
    creationCount: 0,
    analysisCount: 0,
    imageFactoryCount: usage.filter((item) => item.usage_type === 'image_factory').length,
    videoGenerationCount: usage.filter((item) => item.usage_type === 'video_generation').length,
  };
}

