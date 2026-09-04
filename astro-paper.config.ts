import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://reborncodinglife.com/",
    title: "LEo的网络日志",
    description: "记录软件开发、云原生、ai 与持续学习。",
    author: "LEo",
    profile: "https://github.com/songleo",
    ogImage: "default-og.jpg",
    lang: "zh-cn",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: false,
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/songleo",
      linkTitle: "访问 LEo 的 github",
    },
    {
      name: "mail",
      url: "mailto:lisong1205@126.com",
      linkTitle: "给 LEo 发邮件",
    },
  ],
  shareLinks: [],
});
