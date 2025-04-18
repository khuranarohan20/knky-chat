import type { Media, Variation } from "types/media";

const DefaultAssetUrls = {
  avatar: "/svgs/default.svg",
  background: "/svgs/defaultBack.svg",
};

export function getAssetUrl({
  media,
  variation = "compressed",
  defaultType = "background",
  poster = false,
}: {
  media: Media | undefined;
  variation?: Variation;
  defaultType?: keyof typeof DefaultAssetUrls;
  poster?: boolean | null;
}) {
  try {
    if (!media || !media._id || (media.type === "video" && poster === null))
      return DefaultAssetUrls[defaultType];

    if (
      media?.signed_urls !== undefined &&
      Object.keys(media.signed_urls).length > 0
    ) {
      if (
        poster &&
        media?.poster?.signed_urls !== undefined &&
        Object.keys(media?.poster?.signed_urls).length > 0
      ) {
        return media.poster?.signed_urls[variation];
      }

      return media.signed_urls[variation];
    }

    const [name, ext] = (
      poster ? (media?.poster?.path as string) : media?.path
    )?.split(".");

    const isPrivate =
      [
        "channel",
        "users",
        "group",
        "chat-media",
        "request",
        "auto-message",
        "service",
      ].some((substring) => media.path.startsWith(substring)) || poster
        ? false
        : variation !== "thumb" &&
          variation !== "blur" &&
          variation !== "thumbnail" &&
          !["Preview", "Poster"].includes(media.used_as);

    const url = `${
      isPrivate ? process.env.private_asset : process.env.public_asset
    }/${name}_${variation}.${ext}${
      (poster ? media?.poster : media)?.signature?.[variation] || ""
    }`;

    return url;
  } catch (error) {
    return DefaultAssetUrls[defaultType];
  }
}
