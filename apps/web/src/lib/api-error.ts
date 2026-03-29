const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Email already registered': '该邮箱已被注册',
  'Username already taken': '用户名已被占用',
  'Invalid email or password': '邮箱或密码错误',
  'Stock not found': '股票不存在',
  'Stock not found or inactive': '股票不存在或已停用',
  'No active season': '当前没有进行中的赛季',
  'Market is closed. Only limit orders allowed.': '当前休市中，仅支持限价单',
  'Limit order requires a price': '限价单必须填写价格',
  'Insufficient funds': '可用资金不足',
  'Insufficient shares': '持仓数量不足',
  'Order not found or not cancellable': '订单不存在或当前不可撤销',
  'Request failed with status code 401': '登录状态已过期，请重新登录',
  'Request failed with status code 403': '没有权限执行该操作',
  'Request failed with status code 404': '请求的资源不存在',
};

export function translateApiErrorMessage(message: string | string[] | undefined, fallback: string): string {
  if (!message) return fallback;

  if (Array.isArray(message)) {
    return message[0] || fallback;
  }

  return ERROR_MESSAGE_MAP[message] || message || fallback;
}
