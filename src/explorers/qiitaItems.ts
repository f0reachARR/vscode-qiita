import { Item } from 'qiita-js-2';
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import * as nls from 'vscode-nls';
import { client } from '../client';
import '../polyfills';
import { ExpandItems } from './models/expandItemsNode';
import { QiitaItem } from './models/qiitaItemsNode';

const localize = nls.loadMessageBundle();

class QiitaItemsProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem|undefined> = new EventEmitter<TreeItem|undefined>();
  public readonly onDidChangeTreeData: Event<TreeItem|undefined> = this._onDidChangeTreeData.event;

  /** 取得した投稿 */
  protected items: Item[] = [];

  /** 全件取得したかどうか */
  protected done = false;

  /** 自分の投稿の配列を返すイテラブル */
  protected itemsIterable = client.fetchMyItems({ page: 1, per_page: 60 });

  /**
   * ツリーデータを更新
   */
  public async refresh () {
    this._onDidChangeTreeData.fire();
  }

  /**
   * `element` に対応するツリーアイテムを取得
   * @param element 取得するelement
   * @return ツリーアイテム
   */
  public getTreeItem (element: QiitaItem): TreeItem {
    return element;
  }

  /**
   * 子要素を取得
   * @param element 取得するelement
   */
  public async getChildren (): Promise<(QiitaItem|ExpandItems)[]> {
    if (!itemsStore.items || !itemsStore.items.length) {
      await itemsStore.refreshItems();
    }

    const children = [];

    for (const item of itemsStore.items) {
      const command = {
        command:   'qiita.openItem',
        title:     localize('commands.openItem.title', '開く'),
        arguments: [ item ],
      };

      children.push(new QiitaItem(item, TreeItemCollapsibleState.None, command));
    }

    // アイテムが最後まで読み込まれていない場合、「さらに読み込む...」を挿入する
    if (!itemsStore.done) {
      children.push(new ExpandItems(TreeItemCollapsibleState.None));
    }

    return children;
  }

  /**
   * イテラブルを初期化して最初のページを再取得
   */
  public async refreshItems () {
    const { value: items, done } = await this.itemsIterable.next('reset');
    this.items = items;
    this.done  = done;
  }

  /**
   * イテラブルのnextを呼び出し
   */
  public async expandItems () {
    const { value: items, done } = await this.itemsIterable.next();
    this.items.concat(items);
    this.done = done;
  }
}

export const qiitaItemsProvider = new QiitaItemsProvider();
