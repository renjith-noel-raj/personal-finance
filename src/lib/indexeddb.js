import Dexie from 'dexie';

const db = new Dexie('PersonalFinance');
db.version(1).stores({
  meta: '&key',
});

export async function localGet(key) {
  const row = await db.meta.get(key);
  return row ? row.value : null;
}

export async function localSet(key, value) {
  await db.meta.put({ key, value });
}

export async function localDelete(key) {
  await db.meta.delete(key);
}

export async function localClear() {
  await db.meta.clear();
}
