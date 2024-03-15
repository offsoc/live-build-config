"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const linkPreviewJs = require("link-preview-js");
const entry = (context) => {
  context.registerCommand(
    "com.blocksuite.bookmark-block.get-bookmark-data-by-link",
    async (url) => {
      const previewData = await linkPreviewJs.getLinkPreview(url, {
        timeout: 6e3,
        headers: {
          "user-agent": "googlebot"
        },
        followRedirects: "follow"
      }).catch(() => {
        return {
          title: "",
          siteName: "",
          description: "",
          images: [],
          videos: [],
          contentType: `text/html`,
          favicons: []
        };
      });
      return {
        title: previewData.title,
        description: previewData.description,
        icon: previewData.favicons[0],
        image: previewData.images[0]
      };
    }
  );
  return () => {
    context.unregisterCommand(
      "com.blocksuite.bookmark-block.get-bookmark-data-by-link"
    );
  };
};
exports.entry = entry;
