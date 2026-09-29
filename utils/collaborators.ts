const avatarColors = ["ffc800", "1cb0f6", "ce82ff", "ff8a65", "58cc02"];
const avatarBackgrounds = [
  "#FFC800",
  "#1CB0F6",
  "#CE82FF",
  "#FF8A65",
  "#58CC02",
];

export type CollaboratorProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  backgroundColor: string;
  isCurrentUser: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]) {
      return record[key] as string;
    }
  }
  return undefined;
}

function makeAvatarUrl(seed: string, colorIndex: number): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: avatarColors[colorIndex % avatarColors.length],
    radius: "50",
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function getCollaboratorProfiles(
  value: unknown,
  currentSocketId?: string,
): CollaboratorProfile[] {
  const users = Array.isArray(value) ? value : [];
  const profiles = users.map((user, index) => {
    const record = asRecord(user);
    const id =
      typeof user === "string"
        ? user
        : (firstString(record ?? {}, [
            "socketId",
            "id",
            "_id",
            "userId",
            "email",
          ]) ?? `collaborator-${index}`);
    const isCurrentUser = id === currentSocketId;
    const name = isCurrentUser
      ? "You"
      : (firstString(record ?? {}, [
          "displayName",
          "name",
          "username",
          "userName",
          "email",
        ]) ?? `Collaborator ${index + 1}`);
    const colorIndex = index % avatarBackgrounds.length;
    const avatarUrl = firstString(record ?? {}, [
      "avatarUrl",
      "avatar",
      "image",
      "profileImage",
      "photoURL",
    ]);

    return {
      id,
      name,
      avatarUrl: isCurrentUser
        ? makeAvatarUrl(`you-${id}`, 0)
        : (avatarUrl ?? makeAvatarUrl(id, colorIndex)),
      backgroundColor: avatarBackgrounds[colorIndex],
      isCurrentUser,
    };
  });

  if (currentSocketId && users.length === 0) {
    profiles.unshift({
      id: currentSocketId,
      name: "You",
      avatarUrl: makeAvatarUrl(`you-${currentSocketId}`, 0),
      backgroundColor: avatarBackgrounds[0],
      isCurrentUser: true,
    });
  }

  return profiles;
}
