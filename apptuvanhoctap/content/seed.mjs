import { topicLessons } from "./topic-journeys.mjs";
import { attachTopicVideos } from "./topic-videos.mjs";
import { seedData } from "../domain.mjs";
import { phase1Lessons } from "./phase-1.mjs";
import { phase2Lessons } from "./phase-2.mjs";
import { phase3Lessons } from "./phase-3.mjs";
import { reviewedVideos } from "./phase-4.mjs";
export function completeSeedData() {
  const data = seedData();
  data.lessons.push(
    ...structuredClone([...phase1Lessons, ...phase2Lessons, ...phase3Lessons, ...topicLessons]),
  );
  for (const item of reviewedVideos)
    for (const id of item.lessonIds)
      data.lessons.find((l) => l.id === id).youtube = structuredClone(
        item.youtube,
      );
  attachTopicVideos(data, topicLessons);
  return data;
}
