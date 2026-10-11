export function driveVideo(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Thông tin video Google Drive không hợp lệ.");
  if (typeof value.url !== "string" || value.url.length > 1000)
    throw new Error("Liên kết Google Drive quá dài hoặc không hợp lệ.");
  let url;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error("Dán liên kết HTTPS của tệp Google Drive.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "drive.google.com" ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error("Chỉ dùng liên kết tệp trên drive.google.com.");
  const id =
    /^\/file\/d\/([\w-]{10,200})(?:\/(?:view|preview))?\/?$/.exec(
      url.pathname,
    )?.[1] ||
    (["/open", "/uc"].includes(url.pathname) ? url.searchParams.get("id") : "");
  if (!/^[\w-]{10,200}$/.test(id || ""))
    throw new Error("Chọn liên kết một tệp video Drive, không dùng thư mục.");
  const resourceKey = url.searchParams.get("resourcekey");
  if (resourceKey && !/^[\w-]{1,200}$/.test(resourceKey))
    throw new Error("Mã chia sẻ Google Drive không hợp lệ.");
  const query = resourceKey ? `?resourcekey=${resourceKey}` : "";
  const text = (key, max, required = true) => {
    if (
      typeof value[key] !== "string" ||
      value[key].length > max ||
      (required && !value[key].trim())
    )
      throw new Error("Điền tên video và nguồn Google Drive hợp lệ.");
    return value[key].trim();
  };
  return {
    url: `https://drive.google.com/file/d/${id}/view${query}`,
    title: text("title", 200),
    channel: text("channel", 150),
    note: text("note", 1000, false),
  };
}
export function driveEmbed(value) {
  return driveVideo(value).url.replace("/view", "/preview");
}
