import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StoredProduct {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selling_points: string | null;
  target_audience: string | null;
  image_urls: string[];
  platform: string;
  created_at: string;
  updated_at: string;
}

interface ProductStoreData {
  products: StoredProduct[];
}

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'products.json');

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProductStoreData>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
    } satisfies ProductStoreData;
  } catch {
    const initial: ProductStoreData = { products: [] };
    await writeFile(dataFile, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function saveStore(data: ProductStoreData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export async function listProductsByUserId(userId: string) {
  const store = await ensureStore();
  return store.products
    .filter((product) => product.user_id === userId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function createProductRecord(
  input: Omit<StoredProduct, 'id' | 'created_at' | 'updated_at'>,
) {
  const store = await ensureStore();
  const timestamp = new Date().toISOString();

  const product: StoredProduct = {
    id: randomUUID(),
    ...input,
    created_at: timestamp,
    updated_at: timestamp,
  };

  store.products.push(product);
  await saveStore(store);
  return product;
}

export async function updateProductRecord(
  productId: string,
  userId: string,
  updates: Partial<Omit<StoredProduct, 'id' | 'user_id' | 'created_at'>>,
) {
  const store = await ensureStore();
  const index = store.products.findIndex((item) => item.id === productId && item.user_id === userId);
  if (index === -1) {
    return null;
  }

  const current = store.products[index];
  const next: StoredProduct = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  store.products[index] = next;
  await saveStore(store);
  return next;
}

export async function deleteProductRecord(productId: string, userId: string) {
  const store = await ensureStore();
  const nextProducts = store.products.filter((item) => !(item.id === productId && item.user_id === userId));
  if (nextProducts.length === store.products.length) {
    return false;
  }

  store.products = nextProducts;
  await saveStore(store);
  return true;
}

