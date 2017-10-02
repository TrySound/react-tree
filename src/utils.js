// @flow

export type TreeRow = {
  key: string,
  parents: string[],
  data: Object
};

type FlattenParams = {
  getKey: any => string,
  children: string,
  data: Object
};

type MoveParams = {
  getKey: any => string,
  children: string,
  data: Object,
  from: string,
  to: string,
  after: string
};

type RemoveParams = {
  getKey: any => string,
  children: string,
  data: Object,
  removing: string
};

const flattenImpl = (data, getKey, children, parents = []) => {
  const list = [
    {
      key: getKey(data),
      parents,
      data
    }
  ];
  const newChildren = data[children];
  const key = getKey(data);
  if (newChildren) {
    newChildren.forEach(d => {
      list.push(...flattenImpl(d, getKey, children, [...parents, key]));
    });
  }
  return list;
};

export const flatten = (params: FlattenParams): TreeRow[] => {
  return flattenImpl(params.data, params.getKey, params.children);
};

const mapByParents = (data, getKey, children, parents, fn) => {
  const newChildren = data[children];
  if (parents.length === 0 || !newChildren) {
    return data;
  }
  const [init, ...tail] = parents;
  if (init === getKey(data)) {
    if (tail.length === 0) {
      return fn(data);
    }
    return Object.assign({}, data, {
      [children]: newChildren.reduce((acc, d) => {
        acc.push(mapByParents(d, getKey, children, tail, fn));
        return acc;
      }, [])
    });
  }
  return data;
};

export const move = (params: MoveParams): Object => {
  const { getKey, children, data, from, to, after } = params;
  const rows = flattenImpl(data, getKey, children);
  const fromRow = rows.find(d => d.key === from);
  const toRow = rows.find(d => d.key === to);
  if (fromRow && toRow) {
    const cleared = mapByParents(data, getKey, children, fromRow.parents, d => {
      return Object.assign({}, d, {
        [children]: d[children].filter(child => getKey(child) !== from)
      });
    });
    return mapByParents(
      cleared,
      getKey,
      children,
      [...toRow.parents, to],
      d => {
        if (after === "") {
          return Object.assign({}, d, {
            [children]: [fromRow.data, ...d[children]]
          });
        }
        const newChildren = [];
        d[children].forEach(child => {
          newChildren.push(child);
          if (getKey(child) === after) {
            newChildren.push(fromRow.data);
          }
        });
        return Object.assign({}, d, {
          [children]: newChildren
        });
      }
    );
  }
  return data;
};

export const remove = (params: RemoveParams): Object => {
  const { getKey, children, data, removing } = params;
  const row = flattenImpl(data, getKey, children).find(d => d.key === removing);
  if (row) {
    return mapByParents(data, getKey, children, row.parents, d => {
      return Object.assign({}, d, {
        [children]: d[children].filter(child => getKey(child) !== removing)
      });
    });
  }
  return data;
};
