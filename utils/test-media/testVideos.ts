import { faker } from "@faker-js/faker";

type Attachment = {
  type: "video" | "image";
  url: string;
};

// Hardcoded test video pool
const testVideos = [
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ,
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  ,
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

const makeAttachment = () => {
  const isVideo = faker.datatype.boolean();

  if (isVideo) {
    // randomly pick from our test video pool
    const video = faker.helpers.arrayElement(testVideos);
    return { type: "video", video };
  }

  // fallback: random image
  return {
    type: "image",
    url: faker.image.urlPicsumPhotos({ width: 400 }),
  };
};
