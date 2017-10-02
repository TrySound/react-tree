// @flow

import * as React from "react";
import ReactDOM from "react-dom";
import Tree from "./Tree.js";

type Leaf = { key: string };

type Group = { key: string, children: Leaf[] };

type State = {
  data: {
    key: string,
    children: Group[]
  }
};

class App extends React.Component<{}, State> {
  state = {
    data: {
      key: "0",
      children: [
        {
          key: "Axis 1",
          children: [
            {
              key: "Tag 1"
            },
            {
              key: "Tag 2"
            }
          ]
        },
        {
          key: "Axis 2",
          children: [
            {
              key: "Tag 3"
            },
            {
              key: "Tag 4"
            }
          ]
        }
      ]
    }
  };

  change = (data: Object) => {
    this.setState({
      data
    });
  };

  render() {
    return (
      <div>
        <Tree data={this.state.data} onChange={this.change} />
      </div>
    );
  }
}

const app = document.createElement("div");

if (document.body) {
  document.body.appendChild(app);
  ReactDOM.render(<App />, app);
}
