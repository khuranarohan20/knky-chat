import { RequestConverseToken, VerifyConverseToken } from "api/chat";
import { MESSAGE_FETCH_LIMIT } from "constants/chat";
import type { Channel, Project } from "converse.svc-client";
import { Converse } from "converse.svc-client";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { MessageInterface, MetaInterface } from "types/chat";
import { chatStore } from "zustand/store";

interface IChatSocket {
  init: () => Promise<void>;
  disconnectSocket: () => void;
  retryInitialization: () => void;
  stopRetries: () => void;
  handleNewProjectMessage: (msg: any) => void;
  updateChannel(channelId: string): Promise<Channel | null>;
  waitTillConnected: () => Promise<void>;
  retryChannelUpdate: (channelId: string) => void;
  closeChannel(): void;
  sendMessageOnProject: (data: {
    message?: string;
    files?: File[];
    meta?: MetaInterface;
    users: string[];
  }) => void;
  getMoreMessages: (time: string) => Promise<void>;
}

class ChatSocket implements IChatSocket {
  channel: Channel | null = null;
  projectInstance: Project | null = null;
  private converse: Converse | null = null;
  private channelId: string | null = null;
  private updatedChannels: Set<string> = new Set();
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private retryCount = 0;

  private get store() {
    return chatStore.getState();
  }

  private get dispatch() {
    return chatStore.getState();
  }

  async init() {
    this.dispatch.setIsLoading(true);

    try {
      if (this.converse) return;

      this.converse = new Converse();
      let newConverseToken = this.store.converseToken;

      try {
        await VerifyConverseToken({
          token: newConverseToken,
          projectId: import.meta.env.KNKY_CONVERSE_PROJECT_ID,
        });
      } catch (error) {
        const res = await RequestConverseToken();
        newConverseToken = res.data.token;
        this.dispatch.setConverseToken(newConverseToken);
      }

      await this.converse.init({
        projectId: import.meta.env.KNKY_CONVERSE_PROJECT_ID,
        converseToken: newConverseToken,
        serverUrl: import.meta.env.KNKY_CONVERSE_HOST,
      });

      this.converse.listenConnectionCallback(async () => {
        if (this.converse) {
          this.projectInstance = await this.converse.connectProject();
        }

        if (this.projectInstance) {
          this.projectInstance.listenNewMessage((msg: any) =>
            this.handleNewProjectMessage(msg)
          );
        }

        if (this.retryTimeoutId) {
          this.stopRetries();
        }
      });
    } catch (error) {
      console.log("Initializing socket failed: ", error);
      this.retryInitialization();
    } finally {
      this.dispatch.setIsLoading(false);
    }
  }

  retryInitialization() {
    if (this.retryCount >= this.maxRetries) {
      toast.error("Failed to initialize socket after multiple attempts.");
      return;
    }

    this.retryCount++;
    const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

    if (this.retryTimeoutId) {
      this.stopRetries();
    }

    this.retryTimeoutId = setTimeout(() => {
      toast.info(`Retrying connection (Attempt ${this.retryCount})...`);
      this.init();
    }, retryDelay);
  }

  stopRetries() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  handleNewProjectMessage(msg: {
    message: {
      message: string;
      sid: string;
      name: string;
      meta: MetaInterface;
      creationTime: string;
    };
  }) {
    const { sid, meta, creationTime } = msg.message;
    if (
      sid === this.store.userDetails._id ||
      meta?.converseId === this.channelId
    )
      return;
    this.dispatch.addMessage(
      {
        ...msg.message,
        sender_id: sid,
        createdAt: creationTime || new Date().toISOString(),
        _id: nanoid(16),
      } as any,
      meta?.converseId
    );
  }

  async updateChannel(channelId: string) {
    if (!this.converse) {
      this.retryCount = 0;
      return null;
    }
    this.dispatch.setIsLoading(true);
    try {
      await this.waitTillConnected();

      this.closeChannel();

      if (this.updatedChannels.has(channelId)) {
        return null;
      }

      this.channelId = channelId;
      this.channel = await this.converse.connectChannel({
        channelId,
        ephemeral: false,
        batch: MESSAGE_FETCH_LIMIT,
      });

      this.setupChannelListeners();

      this.updatedChannels.add(channelId);
      this.retryCount = 0;
      return this.channel;
    } catch (error) {
      console.error("Error updating channel:", error);
      toast.error("Could not connect to channel, trying again..");
      this.retryChannelUpdate(channelId);
      return null;
    } finally {
      this.dispatch.setIsLoading(false);
    }
  }

  async waitTillConnected(): Promise<void> {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        if (this.converse?.checkConnection()) {
          clearInterval(intervalId);
          resolve();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error("Connection check timed out"));
      }, 10000);
    });
  }

  retryChannelUpdate(channelId: string) {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.retryCount++;
    const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

    if (this.retryTimeoutId) {
      this.stopRetries();
    }

    this.retryTimeoutId = setTimeout(() => {
      console.log(
        `Retrying channel update (Attempt ${this.retryCount}) for channel ${channelId}...`
      );
      this.updateChannel(channelId);
    }, retryDelay);
  }

  async sendMessageOnChannel(data: {
    message?: string;
    files?: File[];
    shareOnProject?: boolean;
    users?: string[];
    meta?: MetaInterface;
  }) {
    if (!this.channel) return;

    if (!data.message && !data.files) {
      throw Error("No message or files to send");
    }

    if (data.shareOnProject && data.users.length > 0) {
      if (!this.projectInstance) return;
      await this.sendMessageOnProject({
        message: data.message || "",
        users: data.users,
        meta: {
          ...data?.meta,
        },
      });
    }

    return this.channel.sendMessage({
      message: data.message || "",
      meta: {},
    });
  }
  async sendMessageOnProject(data: {
    message?: string;
    files?: File[];
    meta?: MetaInterface;
    users: string[];
  }) {
    if (!this.projectInstance) return;

    if (!data.message && !data.files) {
      throw Error("No message or files to send");
    }

    return this.projectInstance.notifyPeople({
      msg: {
        message: data.message || "",
        meta: {
          ...data?.meta,
          converseId: this.channelId,
        },
        creationTime: new Date().toISOString(),
      },
      users: data.users,
    });
  }

  setupChannelListeners() {
    if (!this.converse) return;
    if (!this.channelId) return;

    this.channel?.listenMessage((message: MessageInterface) =>
      this.handleNewMessageInChannel(this.channelId, message)
    );
  }

  handleNewMessageInChannel(channelId: string, message: MessageInterface) {
    this.dispatch.addMessage(message, channelId);
  }

  closeChannel() {
    if (this.channelId) {
      this.converse?.closeChannel(this.channelId as string);
      this.updatedChannels.delete(this.channelId as string);
    }
  }

  async getMoreMessages(timestamp: string) {
    if (!this.channel) return;
    const prevMessages = this.store.activeChat?.complete_messages || [];

    const messages = await this.channel.getMessages({ time: timestamp });
    const newMessages = [
      ...(messages?.msgs?.read || []),
      ...(messages?.msgs?.unread || []),
    ];

    if (newMessages.length) {
      this.dispatch.setCompleteMessages([
        ...newMessages,
        ...prevMessages,
      ] as any);
      this.dispatch.decreaseFirstItemIndex(newMessages.length);
    }
  }

  disconnectSocket() {
    this.converse.closeChannel(this.channelId || "");
    this.converse.closeProject();
    this.converse.shutdown();
  }
}

const chatSocket = new ChatSocket();
export default chatSocket;
