import { useEffect } from "react";
import type { MessageInterface } from "types/chat";
import { getAssetUrl } from "utils/asset";

const MediaRenderer = (props: {
  message: MessageInterface;
  isSender: boolean;
}) => {
  useEffect(() => {
    if (props?.message?.meta?.media) {
      console.log(props.message);
    }
  }, [props?.message?._id]);
  return (
    <div>
      <div>{props.message?.message}</div>
      {props?.message?.meta?.media && (
        <img
          src={getAssetUrl({
            media: Array.isArray(props.message?.meta?.media)
              ? props.message?.meta?.media?.[0]
              : props.message?.meta?.media,
          })}
          className="h-[300px] w-full"
        />
      )}
    </div>
  );
};

export default MediaRenderer;
