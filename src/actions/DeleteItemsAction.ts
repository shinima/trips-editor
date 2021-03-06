import { List, Map, OrderedSet } from 'immutable'
import { Action, AppHistory, Item, ItemId, State } from '../interfaces'

export default class DeleteItemsAction extends Action {
  prevSelIdSet: OrderedSet<ItemId>
  deletedItems: Map<ItemId, Item>
  prevZList: List<ItemId>

  constructor(readonly itemIdArray: number[]) {
    super()
  }

  prepare(h: AppHistory): AppHistory {
    this.prevSelIdSet = h.state.selIdSet
    this.deletedItems = h.state.items.filter((_, itemId) => this.itemIdArray.includes(itemId))
    this.prevZList = h.state.zlist
    return h
  }

  next(state: State) {
    return state
      .update('items', items => items.filterNot(item => this.itemIdArray.includes(item.id)))
      .update('zlist', zlist => zlist.filterNot(itemId => this.itemIdArray.includes(itemId)))
      .set('selIdSet', OrderedSet())
  }

  prev(state: State) {
    return state
      .update('items', items => items.merge(this.deletedItems))
      .set('zlist', this.prevZList)
      .set('selIdSet', this.prevSelIdSet)
  }

  getMessage() {
    return `Delete items. items={${this.deletedItems.keySeq().join(',')}}`
  }
}
