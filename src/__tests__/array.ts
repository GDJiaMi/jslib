/**
 * 数组相关函数单元测试
 */

import { arrayJoin } from '../array'

describe('test arrayJoin', () => {
  it('test arrayJoin by object[]', () => {
    const fn = arrayJoin([{ a: 1 }, { a: 1 }, { a: 1 }], { b: 0 })

    expect(fn).toMatchObject([{ a: 1 }, { b: 0 }, { a: 1 }, { b: 0 }, { a: 1 }])
  })

  it('test arrayJoin by string[]', () => {
    const fn = arrayJoin(['1', '2', '3'], '0')

    expect(fn).toStrictEqual(['1', '0', '2', '0', '3'])
  })

  it('test arrayJoin when array length = 1', () => {
    const fn = arrayJoin(['1'], '0')

    expect(fn).toStrictEqual(['1'])
  })
})
