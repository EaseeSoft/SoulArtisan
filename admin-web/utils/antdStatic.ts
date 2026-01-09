import type { MessageInstance } from 'antd/es/message/interface';

let messageInstance: MessageInstance;

export const setMessageInstance = (instance: MessageInstance) => {
  messageInstance = instance;
};

export const showMessage = {
  success: (content: string) => messageInstance?.success(content),
  error: (content: string) => messageInstance?.error(content),
  warning: (content: string) => messageInstance?.warning(content),
  info: (content: string) => messageInstance?.info(content),
};
