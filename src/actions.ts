import { List, Map, OrderedMap, Record } from 'immutable'
import { Item, ItemId, Selection } from './interfaces'

export const StateRecord = Record({
  items: Map<ItemId, Item>(),
  zlist: List<ItemId>(),
})

export const initState = StateRecord()
export type State = typeof initState
export interface Action {
  (s: State): State
}
export type ZIndexOp = 'z-inc' | 'z-dec' | 'z-top' | 'z-bottom'

export default {
  deletePoint(sel: Selection): Action {
    return state =>
      state.setIn(['items', sel.sids.first(), 'points'], sel.item(state).points.delete(sel.svi))
  },
  deleteSelection(sel: Selection): Action {
    return state => {
      const sids = sel.sids
      if (sids.isEmpty()) {
        return state
      }
      return state
        .update('items', items => items.filterNot(item => sids.has(item.id)))
        .update('zlist', zlist => zlist.filterNot(itemId => sids.has(itemId)))
    }
  },
  moveItems(movedItems: OrderedMap<ItemId, Item>): Action {
    return state => state.mergeIn(['items'], movedItems)
  },
  addItem(item: Item): Action {
    return state =>
      state.setIn(['items', item.id], item).update('zlist', zlist => zlist.push(item.id))
  },
  updateItems(updateItems: OrderedMap<ItemId, Item>): Action {
    return state => state.mergeIn(['items'], updateItems)
  },
  updateZIndex(sel: Selection, op: ZIndexOp): Action {
    return state => {
      const sids = sel.sids
      if (sids.count() !== 1) {
        return state
      } else {
        const sid = sids.first()
        const zlist = state.zlist
        const oldZ = zlist.indexOf(sid)
        const zs = zlist.delete(oldZ)
        if (op === 'z-inc') {
          return state.set('zlist', zs.insert(oldZ + 1, sid))
        } else if (op === 'z-dec') {
          return oldZ === 0 ? state : state.set('zlist', zs.insert(oldZ - 1, sid))
        } else if (op === 'z-top') {
          return state.set('zlist', zs.push(sid))
        } else {
          // z-bottom
          return state.set('zlist', zs.unshift(sid))
        }
      }
    }
  },
  lockItems(sel: Selection): Action {
    return state => {
      const lockedItems = state.items
        .filter(item => sel.sids.has(item.id))
        .map(item => item.set('locked', true))
      return state.mergeIn(['items'], lockedItems)
    }
  },
  unlockItems(sel: Selection): Action {
    return state => {
      const unlockedItems = state.items
        .filter(item => sel.sids.has(item.id))
        .map(item => item.set('locked', false))
      return state.mergeIn(['items'], unlockedItems)
    }
  },
  movePoint([item, pointIndex, dx, dy]: [Item, number, number, number]): Action {
    return state =>
      state.updateIn(['items', item.id, 'points', pointIndex], p => ({
        x: item.points.get(pointIndex).x + dx,
        y: item.points.get(pointIndex).y + dy,
      }))
  },
}
