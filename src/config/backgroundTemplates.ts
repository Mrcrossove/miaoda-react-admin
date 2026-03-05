/**
 * 图片工厂背景图模板配置
 * 提供通用的背景图模板，适配全行业
 */

export interface BackgroundTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // 缩略图URL
  fullImage: string; // 完整图片URL
  category: 'simple' | 'gradient' | 'texture'; // 风格分类
}

// 预设背景图模板
export const backgroundTemplates: BackgroundTemplate[] = [
  {
    id: 'pink-dream',
    name: '粉色梦幻',
    description: '温柔粉色梦幻背景，适合美妆、情感、母婴',
    thumbnail: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0tbv9c.png',
    fullImage: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0tbv9c.png',
    category: 'gradient',
  },
  {
    id: 'yellow-grid',
    name: '黄色网格',
    description: '活泼黄色网格背景，适合教育、学习、笔记',
    thumbnail: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgh.png',
    fullImage: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgh.png',
    category: 'simple',
  },
  {
    id: 'chinese-style',
    name: '中国风',
    description: '古典中国风背景，适合国学、文化、养生',
    thumbnail: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgj.png',
    fullImage: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgj.png',
    category: 'texture',
  },
  {
    id: 'warm-blur',
    name: '温暖虚化',
    description: '温暖虚化背景，适合美食、咖啡、生活',
    thumbnail: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgi.png',
    fullImage: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgi.png',
    category: 'texture',
  },
  {
    id: 'simple-cream',
    name: '简约米白',
    description: '简约米白背景，适合所有行业，百搭通用',
    thumbnail: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgg.png',
    fullImage: 'https://miaoda-conversation-file.cdn.bcebos.com/user-8gfsvhtn1fk0/conv-8sm6r7tdrncw/20260118/file-90olct0t4bgg.png',
    category: 'simple',
  },
];

// 获取所有模板
export function getAllTemplates(): BackgroundTemplate[] {
  return backgroundTemplates;
}

// 根据ID获取模板
export function getTemplateById(id: string): BackgroundTemplate | undefined {
  return backgroundTemplates.find((template) => template.id === id);
}

// 根据分类获取模板
export function getTemplatesByCategory(category: BackgroundTemplate['category']): BackgroundTemplate[] {
  return backgroundTemplates.filter((template) => template.category === category);
}
