/**
 * UUID验证和处理工具函数
 */

/**
 * 验证字符串是否为有效的UUID格式
 * @param uuid 要验证的字符串
 * @returns 是否为有效UUID
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  // UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 从localStorage获取用户ID并验证
 * @returns 有效的UUID或null
 */
export function getUserIdFromStorage(): string | null {
  try {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) {
      console.warn('[UUID] localStorage中没有user_info');
      return null;
    }
    
    const user = JSON.parse(userInfo);
    const userId = user?.userId;
    
    if (!isValidUUID(userId)) {
      console.warn('[UUID] userId不是有效的UUID:', userId);
      return null;
    }
    
    return userId;
  } catch (error) {
    console.error('[UUID] 解析user_info失败:', error);
    return null;
  }
}
