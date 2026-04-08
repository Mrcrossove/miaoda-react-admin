import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyProductPage from './pages/MyProductPage';
import ProductSelectionPage from './pages/ProductSelectionPage';
import CompetitorAnalysisPage from './pages/CompetitorAnalysisPage';
import ContentCreationPage from './pages/ContentCreationPage';
import CognitiveAwakeningPage from './pages/CognitiveAwakeningPage';
import AgentChatPage from './pages/AgentChatPage';
import ImageFactoryPage from './pages/ImageFactoryPage';
import EcommerceVideoPage from './pages/EcommerceVideoPage';
import AIDigitalHumanPage from './pages/AIDigitalHumanPage';
import ProfilePage from './pages/ProfilePage';
import CreditsPage from './pages/CreditsPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CreditHistoryPage from './pages/CreditHistoryPage';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
  },
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
  {
    name: '我有产品',
    path: '/my-product',
    element: <MyProductPage />,
    visible: false,
  },
  {
    name: '帮我选品',
    path: '/product-selection',
    element: <ProductSelectionPage />,
    visible: false,
  },
  {
    name: '分析同行',
    path: '/competitor-analysis',
    element: <CompetitorAnalysisPage />,
    visible: false,
  },
  {
    name: '图文创作',
    path: '/content-creation',
    element: <ContentCreationPage />,
    visible: false,
  },
  {
    name: '认知觉醒',
    path: '/cognitive-awakening',
    element: <CognitiveAwakeningPage />,
    visible: false,
  },
  {
    name: '智能体对话',
    path: '/agent-chat/:agentId',
    element: <AgentChatPage />,
    visible: false,
  },
  {
    name: '图片工厂',
    path: '/image-factory',
    element: <ImageFactoryPage />,
    visible: false,
  },
  {
    name: '电商视频专区',
    path: '/ecommerce-video',
    element: <EcommerceVideoPage />,
    visible: false,
  },
  {
    name: 'AI数字人',
    path: '/ai-digital-human',
    element: <AIDigitalHumanPage />,
    visible: false,
  },
  {
    name: '个人中心',
    path: '/profile',
    element: <ProfilePage />,
    visible: false,
  },
  {
    name: '灵感值充值',
    path: '/credits',
    element: <CreditsPage />,
    visible: false,
  },
  {
    name: '订单详情',
    path: '/order/:orderNo',
    element: <OrderDetailPage />,
    visible: false,
  },
  {
    name: '消费记录',
    path: '/credits/history',
    element: <CreditHistoryPage />,
    visible: false,
  },
];

export default routes;
