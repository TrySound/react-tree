// @flow

import * as React from "react";
import { type TreeRow, flatten, move } from "./utils.js";

type Props = {|
  data: Object,
  root: boolean,
  rowHeight: number,
  getKey: any => string,
  childrenField: string,
  dragGroups: boolean,
  renderGroup: ({ ...TreeRow, ...Object }) => React.Node,
  renderLeaf: TreeRow => React.Node,
  onChange: Object => void
|};

type State = {|
  moving: ?{ x: number, y: number },
  tmpData: ?(TreeRow[]),
  visible: {
    [key: string]: boolean
  }
|};

const defaultRenderGroup = ({ key, parents, toggle, closed }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      paddingLeft: (parents.length - 1) * 8
    }}
  >
    <div
      style={{
        borderTop: "6px solid transparent",
        borderBottom: "6px solid transparent",
        borderLeft: "6px solid",
        marginRight: 4,
        transform: closed ? "" : "rotate(45deg)"
      }}
      onClick={toggle}
    />
    {key}
  </div>
);

const defaultRenderLeaf = ({ key, parents }) => (
  <div style={{ paddingLeft: (parents.length - 1) * 8 }}>{key}</div>
);

class Tree extends React.Component<Props, State> {
  static defaultProps = {
    root: false,
    rowHeight: 30,
    getKey: d => d.key,
    childrenField: "children",
    dragGroups: false,
    renderGroup: defaultRenderGroup,
    renderLeaf: defaultRenderLeaf
  };

  state = {
    moving: null,
    tmpData: null,
    visible: {}
  };

  rows = flatten({
    getKey: this.props.getKey,
    children: this.props.childrenField,
    data: this.props.data
  }).slice(this.props.root ? 0 : 1);

  container: ?HTMLElement;
  movingRow: ?TreeRow;
  targetRow: ?TreeRow;
  downPoint: ?{ x: number, y: number };

  toggle = (key: string) => {
    this.setState(state => ({
      visible: Object.assign({}, state.visible, {
        [key]: !state.visible[key]
      })
    }));
  };

  refContainer = (element: ?HTMLElement) => {
    this.container = element;
  };

  down = (e: SyntheticMouseEvent<HTMLElement>) => {
    const { dragGroups, rowHeight, childrenField } = this.props;
    const { container, rows } = this;
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const movingRow = rows[Math.floor(y / rowHeight)];
      if (this.dragGroups || !movingRow.data[childrenField]) {
        this.movingRow = movingRow;
        this.downPoint = {
          x,
          y
        };
      }
    }
    document.addEventListener("mousemove", this.move);
    document.addEventListener("mouseup", this.up);
  };

  move = (e: MouseEvent) => {
    const { container, movingRow, downPoint } = this;
    const { rowHeight, root, data, getKey, childrenField } = this.props;
    const { visible } = this.state;
    if (container && downPoint) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const movedX = Math.abs(downPoint.x - x) > 2;
      const movedY = Math.abs(downPoint.y - y) > 2;
      if (this.state.moving || movedX || movedY) {
        e.preventDefault();
        const targetRow = this.rows[Math.floor(y / rowHeight)];
        if (
          targetRow &&
          targetRow !== this.targetRow &&
          movingRow &&
          targetRow.key !== movingRow.key
        ) {
          this.targetRow = targetRow;
          const to = targetRow.data[childrenField]
            ? targetRow.key
            : targetRow.parents[targetRow.parents.length - 1];
          const after = targetRow.data[childrenField] ? "" : targetRow.key;
          this.setState({
            tmpData: flatten({
              getKey,
              children: childrenField,
              data: move({
                getKey,
                children: childrenField,
                data,
                from: movingRow.key,
                to,
                after
              })
            })
              .slice(root ? 0 : 1)
              .filter(d =>
                d.parents.every(parent => visible[parent] !== false)
              ),
            moving: {
              x,
              y
            }
          });
        } else {
          this.setState({
            moving: {
              x,
              y
            }
          });
        }
      }
    }
  };

  up = (e: MouseEvent) => {
    const { data, getKey, childrenField, rowHeight } = this.props;
    const { movingRow, targetRow } = this;
    if (this.container && this.state.moving) {
      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (targetRow && movingRow && targetRow.key !== movingRow.key) {
        const lastParent = targetRow.parents[targetRow.parents.length - 1];
        const to = targetRow.data[childrenField] ? targetRow.key : lastParent;
        const after = targetRow.data[childrenField] ? "" : targetRow.key;
        this.props.onChange(
          move({
            data,
            getKey,
            children: childrenField,
            from: movingRow.key,
            to,
            after
          })
        );
      }

      this.movingRow = null;
      this.targetRow = null;
      this.downPoint = null;
      this.setState({
        moving: null,
        tmpData: null
      });
    }
    document.removeEventListener("mousemove", this.move);
    document.removeEventListener("mouseup", this.up);
  };

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.move);
    document.removeEventListener("mouseup", this.up);
  }

  componentWillUpdate(nextProps: Props, nextState: State) {
    const { root, data, getKey, childrenField } = nextProps;
    const { visible } = nextState;
    if (
      this.props.root !== root ||
      this.props.getKey !== getKey ||
      this.props.childrenField !== childrenField ||
      this.props.data !== data ||
      this.state.visible !== visible
    ) {
      this.rows = flatten({
        getKey: nextProps.getKey,
        children: nextProps.childrenField,
        data: nextProps.data
      })
        .slice(nextProps.root ? 0 : 1)
        .filter(d => d.parents.every(parent => visible[parent] !== false));
    }
  }

  render() {
    const { movingRow } = this;
    const { rowHeight, childrenField, renderGroup, renderLeaf } = this.props;
    const { moving, tmpData, visible } = this.state;
    const containerStyle = {
      position: "relative",
      height: this.rows.length * rowHeight
    };
    return (
      <div ref={this.refContainer} style={containerStyle}>
        {(tmpData || this.rows).map((d, i) => {
          const rowStyle = {
            position: "absolute",
            top: 0,
            right: 0,
            left: 0,
            transform: `translateY(${i * rowHeight}px)`,
            height: rowHeight
          };
          const toggle = () => this.toggle(d.key);
          const closed = visible[d.key] === false;
          return (
            <div key={d.key} style={rowStyle} onMouseDown={this.down}>
              {d.data[childrenField]
                ? renderGroup(Object.assign({}, d, { closed, toggle }))
                : renderLeaf(d)}
            </div>
          );
        })}
        {movingRow &&
          moving && (
            <div
              key="ghost"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                left: 0,
                transform: `translate(${moving.x}px, ${moving.y}px)`,
                height: rowHeight
              }}
            >
              {movingRow.data[childrenField]
                ? renderGroup(movingRow)
                : renderLeaf(movingRow)}
            </div>
          )}
      </div>
    );
  }
}

export default Tree;
