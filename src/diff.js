function indexById(arr = []) {
  const m = new Map();
  for (const x of arr) m.set(x.id, x);
  return m;
}

function shallowChanged(a, b, keys) {
  for (const k of keys) {
    if (String(a?.[k]) !== String(b?.[k])) return true;
  }
  return false;
}

export function calculateDiff(prev, next) {
  if (!prev) {
    return {
      ts: new Date().toISOString(),
      kind: "initial",
      summary: { roles: { added: next?.roles?.length ?? 0 }, channels: { added: next?.channels?.length ?? 0 } }
    };
  }

  const prevRoles = indexById(prev.roles);
  const nextRoles = indexById(next.roles);
  const prevCh = indexById(prev.channels);
  const nextCh = indexById(next.channels);

  const roles = { added: [], removed: [], changed: [] };
  for (const [id, r] of nextRoles) {
    if (!prevRoles.has(id)) roles.added.push({ id, name: r.name });
    else {
      const pr = prevRoles.get(id);
      if (shallowChanged(pr, r, ["name", "color", "permissions", "position", "hoist", "mentionable"])) {
        roles.changed.push({ id, from: { name: pr.name, position: pr.position }, to: { name: r.name, position: r.position } });
      }
    }
  }
  for (const [id, r] of prevRoles) {
    if (!nextRoles.has(id)) roles.removed.push({ id, name: r.name });
  }

  const channels = { added: [], removed: [], changed: [] };
  for (const [id, c] of nextCh) {
    if (!prevCh.has(id)) channels.added.push({ id, name: c.name });
    else {
      const pc = prevCh.get(id);
      if (shallowChanged(pc, c, ["name", "type", "parentId", "position"])) {
        channels.changed.push({ id, from: { name: pc.name, parentId: pc.parentId }, to: { name: c.name, parentId: c.parentId } });
      }
      // overwrites are important; compare counts + hash-ish string
      const po = JSON.stringify(pc.overwrites ?? []);
      const no = JSON.stringify(c.overwrites ?? []);
      if (po !== no) {
        channels.changed.push({ id, overwritesChanged: true });
      }
    }
  }
  for (const [id, c] of prevCh) {
    if (!nextCh.has(id)) channels.removed.push({ id, name: c.name });
  }

  return {
    ts: new Date().toISOString(),
    kind: "diff",
    summary: {
      roles: { added: roles.added.length, removed: roles.removed.length, changed: roles.changed.length },
      channels: { added: channels.added.length, removed: channels.removed.length, changed: channels.changed.length }
    },
    roles,
    channels
  };
}
