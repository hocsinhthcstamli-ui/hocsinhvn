import { test } from "node:test";
import assert from "node:assert/strict";
import { driveVideo, driveEmbed } from "../drive.mjs";
import { seedData } from "../domain.mjs";
import { validateBackup } from "../server.mjs";

const video = {
  url: "https://drive.google.com/file/d/sample_file_123456/view?usp=sharing&resourcekey=key_123",
  title: "Bài mẫu",
  channel: "Giáo viên",
  note: "Chọn thẻ sau khi xem.",
};
test("Drive links normalize securely and retain required resource keys", () => {
  assert.equal(
    driveVideo(video).url,
    "https://drive.google.com/file/d/sample_file_123456/view?resourcekey=key_123",
  );
  assert.equal(
    driveEmbed(video),
    "https://drive.google.com/file/d/sample_file_123456/preview?resourcekey=key_123",
  );
  for (const url of [
    "https://drive.google.com/open?id=sample_file_123456",
    "https://drive.google.com/uc?id=sample_file_123456",
    "https://drive.google.com/file/d/sample_file_123456/preview",
  ])
    assert.equal(
      driveVideo({ ...video, url }).url,
      "https://drive.google.com/file/d/sample_file_123456/view",
    );
  for (const url of [
    "http://drive.google.com/file/d/sample_file_123456/view",
    "https://drive.google.com.evil.test/file/d/sample_file_123456/view",
    "https://user@drive.google.com/file/d/sample_file_123456/view",
    "https://drive.google.com/drive/folders/sample_file_123456",
    "https://drive.google.com/file/d/sample_file_123456/view?resourcekey=%22%3E",
    "javascript:alert(1)",
  ])
    assert.throws(() => driveVideo({ ...video, url }));
  assert.throws(() => driveVideo({ ...video, title: "" }));
  assert.equal(driveVideo(null), null);
});
test("Backups preserve Drive metadata and reject simultaneous video providers", () => {
  const data = seedData();
  data.lessons[0].drive = video;
  assert.deepEqual(validateBackup(data).lessons[0].drive, driveVideo(video));
  data.lessons[0].youtube = {
    url: "https://youtu.be/8dWqtK8jI9o",
    title: "Other",
    channel: "Source",
    note: "",
  };
  assert.throws(() => validateBackup(data), /một nguồn/);
});
