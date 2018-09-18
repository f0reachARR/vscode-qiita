import { QuickPickItem, window } from 'vscode';
import { client } from '../client';

/**
 * Tagの情報を基にQuickPickItemを作成します
 * @param id タグのID
 * @param followersCount フォロワーの数
 * @return QuickPickItem
 */
export const makeQuickPickItemFromTag = (id: string, followersCount: number) => ({
  label: id,
  description: `${followersCount}件の投稿`,
});

/**
 * キーワードからタグを検索して QuickPickItem の形で返します
 * @param value キーワード
 * @return QuickPickItem
 */
async function suggestTags (value: string) {
  const results = (await client.searchTags(value)).slice(0, 9);

  // キーワードに相当するタグがまだ作成されていない場合、候補の一件目にそのタグを挿入
  // tag.nameをケースインセンシティブで比較
  if (value && !results.map((tag) => tag.name).map((name) => RegExp(name, 'i').test(value)).includes(true)) {
    results.unshift({
      name: value,
      url_name: value,
      follower_count: 0,
      item_count: 0,
    });
  }

  return results.map((tag) => makeQuickPickItemFromTag(tag.name, tag.follower_count));
}

/**
 * タグを指定させるQuickPickerを作成
 * @param selectedItems 選択済みのタグ
 * @return QuickPicker
 */
export function tagQuickPickCreator (selectedItems: QuickPickItem[]) {
  const quickPick = window.createQuickPick();

  quickPick.canSelectMany = true;
  quickPick.items         = selectedItems;
  quickPick.selectedItems = selectedItems;
  quickPick.title         = '投稿に登録するタグを入力してください';
  quickPick.placeholder   = '例) Rails React Mastodon';

  quickPick.onDidChangeValue(async (value: string) => {
    quickPick.busy = true;
    const suggestedItems = await suggestTags(value);
    quickPick.busy = false;

    quickPick.items = [...suggestedItems, ...quickPick.selectedItems];
    quickPick.selectedItems = quickPick.selectedItems;
  });

  return quickPick;
}
