let counter = 0;

/**
 * Short unique id for client-side entities (poll options, comments, messages).
 *
 * Index-derived ids collide: removing the middle of [o1, o2, o3] and adding one
 * back would mint "o3" a second time, which breaks React keys and any lookup by
 * id. A counter plus the clock avoids that without pulling in a uuid package.
 */
export function uid(prefix = "id") {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}`;
}
