export function parseAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  const street = parts[0] || addr;
  const city = parts[1] || "";
  let state = "";
  let zip = "";
  if (parts[2]) {
    const stateZip = parts[2].split(" ");
    zip = stateZip.pop() || "";
    state = stateZip.join(" ");
  }
  return { street, city, state, zip };
}