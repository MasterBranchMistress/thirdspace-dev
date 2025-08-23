import { faker } from "@faker-js/faker";

type Attachment = {
  type: "video" | "image";
  url: string;
  title?: string;
  description?: string;
  thumb?: string;
  subtitle?: string;
};

// Hardcoded test video pool
const testVideos: Omit<Attachment, "type">[] = [
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "For Bigger Blazes",
    description:
      "HBO GO now works with Chromecast -- the easiest way to enjoy online video on your TV. For when you want to settle into your Iron Throne to watch the latest episodes. For $35.\nLearn how to use Chromecast with HBO GO and more at google.com/chromecast.",
    thumb: "images/ForBiggerBlazes.jpg",
    subtitle: "By Google",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "For Bigger Escape",
    description:
      "Introducing Chromecast. The easiest way to enjoy online video and music on your TV—for when Batman's escapes aren't quite big enough. For $35. Learn how to use Chromecast with Google Play Movies and more at google.com/chromecast.",
    thumb: "images/ForBiggerEscapes.jpg",
    subtitle: "By Google",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    title: "For Bigger Fun",
    description:
      "Introducing Chromecast. The easiest way to enjoy online video and music on your TV. For $35. Find out more at google.com/chromecast.",
    thumb: "images/ForBiggerFun.jpg",
    subtitle: "By Google",
  },
];

const makeAttachment = (): Attachment => {
  const isVideo = faker.datatype.boolean();

  if (isVideo) {
    // randomly pick from our test video pool
    const video = faker.helpers.arrayElement(testVideos);
    return { type: "video", ...video };
  }

  // fallback: random image
  return {
    type: "image",
    url: faker.image.urlLoremFlickr({ width: 400 }),
  };
};

// Build an array of attachments
export const attachments = faker.helpers.multiple<Attachment>(makeAttachment, {
  count: faker.number.int({ min: 0, max: 5 }),
});
