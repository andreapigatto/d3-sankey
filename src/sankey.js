import {ascending, min, sum} from "d3-array";
import {map, nest} from "d3-collection";
import {justify} from "./align";
import constant from "./constant";

function ascendingSourceBreadth(a, b) {
  return ascendingBreadth(a.source, b.source) || a.index - b.index;
}

function ascendingTargetBreadth(a, b) {
  return ascendingBreadth(a.target, b.target) || a.index - b.index;
}

function ascendingBreadth(a, b) {
  return a.y0 - b.y0;
}

function value(d) {
  return d.value;
}

function nodeCenter(node) {
  return (node.y0 + node.y1) / 2;
}

function weightedSource(link) {
  return nodeCenter(link.source) * link.value;
}

function weightedTarget(link) {
  return nodeCenter(link.target) * link.value;
}

function defaultId(d) {
  return d.index;
}

function defaultNodes(graph) {
  return graph.nodes;
}

function defaultLinks(graph) {
  return graph.links;
}

function find(nodeById, id) {
  var node = nodeById.get(id);
  if (!node) throw new Error("missing: " + id);
  return node;
}

export default function() {
  var x0 = 0, y0 = 0, x1 = 1, y1 = 1, // extent
      dx = 24, // nodeWidth
      py = 8, // nodePadding
      id = defaultId,
      align = justify,
      nodes = defaultNodes,
      links = defaultLinks,
      iterations = 32;

  function sankey() {
    var graph = {nodes: nodes.apply(null, arguments), links: links.apply(null, arguments)};
    computeNodeLinks(graph);
    computeNodeValues(graph);
    computeNodeDepths(graph);
    computeNodeBreadths(graph, iterations);
    computeLinkBreadths(graph);
    return graph;
  }

  sankey.update = function(graph) {
    computeLinkBreadths(graph);
    return graph;
  };

  sankey.nodeId = function(_) {
    return arguments.length ? (id = typeof _ === "function" ? _ : constant(_), sankey) : id;
  };

  sankey.nodeAlign = function(_) {
    return arguments.length ? (align = typeof _ === "function" ? _ : constant(_), sankey) : align;
  };

  sankey.nodeWidth = function(_) {
    return arguments.length ? (dx = +_, sankey) : dx;
  };

  sankey.nodePadding = function(_) {
    return arguments.length ? (py = +_, sankey) : py;
  };

  sankey.nodes = function(_) {
    return arguments.length ? (nodes = typeof _ === "function" ? _ : constant(_), sankey) : nodes;
  };

  sankey.links = function(_) {
    return arguments.length ? (links = typeof _ === "function" ? _ : constant(_), sankey) : links;
  };

  sankey.size = function(_) {
    return arguments.length ? (x0 = y0 = 0, x1 = +_[0], y1 = +_[1], sankey) : [x1 - x0, y1 - y0];
  };

  sankey.extent = function(_) {
    return arguments.length ? (x0 = +_[0][0], x1 = +_[1][0], y0 = +_[0][1], y1 = +_[1][1], sankey) : [[x0, y0], [x1, y1]];
  };

  sankey.iterations = function(_) {
    return arguments.length ? (iterations = +_, sankey) : iterations;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks(graph) {
    graph.nodes.forEach(function(node, i) {
      node.index = i;
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    var nodeById = map(graph.nodes, id);
    graph.links.forEach(function(link, i) {
      link.index = i;
      var source = link.source, target = link.target;
      if (typeof source !== "object") source = link.source = find(nodeById, source);
      if (typeof target !== "object") target = link.target = find(nodeById, target);
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues(graph) {
    graph.nodes.forEach(function(node) {
      node.value = Math.max(
        sum(node.sourceLinks, value),
        sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the depth (x-position) for each node.
  // Nodes are assigned the maximum depth of incoming neighbors plus one;
  // nodes with no incoming links are assigned depth zero, while
  // nodes with no outgoing links are assigned the maximum depth.
  function computeNodeDepths(graph) {
    var nodes, next, x;
    var max_xPos = 0;

    // Depth is level position on x from left. next is array of nodes to consider on next loop.
    for (nodes = graph.nodes, next = [], x = 0; nodes.length; ++x, nodes = next, next = []) {
      //console.log("-----------------")
    //console.log("EXT FOR DEPTH")
    //console.log("nodes", nodes)
    //console.log("next", next)
    //console.log("x", x)
    //console.log("-----------------")

    nodes.forEach(function(node) {
      // If fixed xPos is defined
      if (node.xPos || node.xPos === 0) {
        // Max xPos considering all nodes
        max_xPos = Math.max(max_xPos, node.xPos);
        console.log("MAX_XPOS", max_xPos);

        // If first loop
        if (x === 0) {
          node.depth = node.xPos;
          //console.log("---INT FOR---");
          //console.log("NODE", node);
          //console.log("X", x);
          //console.log("XPOS", node.xPos);
          //console.log("DEPTH", node.depth);
          //console.log("-----------------");
        } else {
          console.log(node, " OUT OF RANGE")
        }
      }
      else
      {
        console.log("NORMAL MODE")
        node.depth = x;
      }

      node.sourceLinks.forEach(function (link) {
        if (next.indexOf(link.target) < 0)
          next.push(link.target);
      })
    })
    };

    // Height is level position on x from right
    for (nodes = graph.nodes, next = [], x = 0; nodes.length; ++x, nodes = next, next = []) {
       //console.log("-----------------")
      //console.log("EXT FOR HEIGHT")
      //console.log("nodes", nodes)
      //console.log("next", next)
      //console.log("x", x)
      //console.log("-----------------")

      nodes.forEach(function(node) {
        // If fixed xPos is defined
        if (node.xPos || node.xPos === 0)
        {
          node.height = x;
          //console.log("---INT FOR---")
          //console.log("NODE", node);
          //console.log("X", x);
          //console.log("XPOS", node.xPos);
          //console.log("HEIGHT", node.height)
          //console.log("-----------------")
         }
        else
        {
          node.height = x;
        }
        ///////////////

        node.targetLinks.forEach(function(link) {
          if (next.indexOf(link.source) < 0) {
            next.push(link.source);
          }
        })
      })
    };

    //console.log("x0", x0);
    //console.log("x1", x1);
    //console.log("dx", dx);
    //console.log("x", x);

    // If max_xPos exist in case of xPos fixed defined
    if (max_xPos > 0)
      x = max_xPos + 1

    // Distance between levels. x is number of levels in case of xPos fixed
    var kx = (x1 - x0 - dx) / (x - 1);
    graph.nodes.forEach(function(node) {
      //console.log("NODE X0", x0)
      //console.log("kx", kx)
      //console.log("EXP", Math.floor(align.call(null, node, x)))
      //console.log("EXP CUSTOM", node.xPos)
      if (node.xPos)
        node.x1 = (node.x0 = x0 + Math.max(0, Math.min(x - 1, node.xPos)) * kx) + dx;
      else
        node.x1 = (node.x0 = x0 + Math.max(0, Math.min(x - 1, Math.floor(align.call(null, node, x)))) * kx) + dx;
      //console.log("NODE X1", node.x1)
    });
  }

  function computeNodeBreadths(graph) {
    var columns = nest()
        .key(function (d) {
          return d.x0;
        })
        .sortKeys(ascending)
        .entries(graph.nodes)
        .map(function (d) {
          return d.values;
        });

    /*var columns_pre_1 = nest()
        .key(function(d) {
          var processId = 0;
          console.log("TARGET", d.targetLinks[0])
          console.log("SOURCE", d.sourceLinks[0])
          if (d.targetLinks[0])
            processId = d.targetLinks[0].process.id
          else if (d.sourceLinks[0])
            processId = d.sourceLinks[0].process.id
          return processId; })
        .sortKeys(ascending)
        .entries(graph.nodes)

    console.log("COLUMNS_INIT", columns_pre_1);

    var columns = columns_pre_1
        .map(function(d) { return d.values; });*/

    console.log("COLUMNS_INIT", columns);

    initializeNodeBreadth();
    resolveCollisions();
    for (var alpha = 1, n = iterations; n > 0; --n) {
      relaxRightToLeft(alpha *= 0.99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeBreadth() {
      console.log("START", columns);
      var ky_inside = y1;
      var ky = min(columns, function (nodes) {
        if (nodes[0].xPos || nodes[0].xPos === 0) {
          nodes.forEach(function (node, i) {
            var processId = 0;
            console.log("NODE", node)
            console.log("TARGET_LINK", node.targetLinks[0])
            console.log("SOURCE_SOURCE", node.sourceLinks[0])
            if (node.targetLinks[0])
              processId = node.targetLinks[0].process.id
            else if (node.sourceLinks[0])
              processId = node.sourceLinks[0].process.id
            console.log("PROCESSID", (processId + 1))
            console.log("EXP2", (y1 - y0 - (processId) * py) / (processId + 1))
            console.log("y1", y1)
            console.log("y0", y0)
            var exp = (y1 - y0 - (processId) * py) / (processId + 1)
            if (exp < ky_inside)
              ky_inside = exp
          })
          return ky_inside
        } else {
          console.log("LENGTH", nodes.length)
          console.log("SUM", sum(nodes, value))
          console.log("y1", y1)
          console.log("y0", y0)
          console.log("EXP", (y1 - y0 - (nodes.length - 1) * py) / sum(nodes, value))
          return (y1 - y0 - (nodes.length - 1) * py) / sum(nodes, value);
        }
      });

      console.log("KY", ky)

      columns.forEach(function (nodes) {
        nodes.forEach(function (node, i) {
          if (node.xPos || node.xPos === 0) {
            var processId = 0;
            console.log("TARGET_LINK", node.targetLinks[0])
            console.log("SOURCE_SOURCE", node.sourceLinks[0])
            if (node.targetLinks[0])
              processId = node.targetLinks[0].process.id
            else if (node.sourceLinks[0])
              processId = node.sourceLinks[0].process.id
            node.y1 = (node.y0 = processId) + node.value * ky;
            console.log("NODE", node)
            console.log("NODEy1", node.y1)
            console.log("NODEy0", node.y0)
          } else {
            nodes.forEach(function (node, i) {
              node.y1 = (node.y0 = i) + node.value * ky;
              console.log("NODE", node)
              console.log("NODEy1", node.y1)
              console.log("NODEy0", node.y0)
            });
          }
        });
      });

      graph.links.forEach(function (link) {
        link.width = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      columns.forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            var dy = (sum(node.targetLinks, weightedSource) / sum(node.targetLinks, value) - nodeCenter(node)) * alpha;
            node.y0 += dy, node.y1 += dy;
          }
        });
      });
    }

    function relaxRightToLeft(alpha) {
      columns.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.sourceLinks.length) {
            var dy = (sum(node.sourceLinks, weightedTarget) / sum(node.sourceLinks, value) - nodeCenter(node)) * alpha;
            node.y0 += dy, node.y1 += dy;
          }
        });
      });
    }

    function resolveCollisions() {
      columns.forEach(function (nodes) {
        var node,
            dy,
            y = y0,
            n = nodes.length,
            i;

        console.log("N", n);

        // Push any overlapping nodes down.
        nodes.sort(ascendingBreadth);

        if (nodes[0].xPos || nodes[0].xPos === 0) {
          nodes.forEach(function (node, i) {
            console.log("NODE FINAL", node);
            var processId = 0;
            if (node.targetLinks[0])
              processId = node.targetLinks[0].process.id
            else if (node.sourceLinks[0])
              processId = node.sourceLinks[0].process.id

            for (i = 0; i < (processId + 1); ++i) {
              console.log("Y_INIT", y);
              dy = y - node.y0;
              if (dy > 0) node.y0 += dy, node.y1 += dy;
              y = node.y1 + py;
              console.log("Y_FINAL", y);
            }

            // If the bottommost node goes outside the bounds, push it back up.
          dy = y - py - y1;
          if (dy > 0) {
            y = (node.y0 -= dy), node.y1 -= dy;

            // Push any overlapping nodes back up.
            for (i = n - 2; i >= 0; --i) {
              node = nodes[i];
              dy = node.y1 + py - y;
              if (dy > 0) node.y0 -= dy, node.y1 -= dy;
              y = node.y0;
            }
          }

          })
        }
        else {
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            console.log("Y_INIT", y);
            dy = y - node.y0;
            if (dy > 0) node.y0 += dy, node.y1 += dy;
            y = node.y1 + py;
            console.log("Y_FINAL", y);
          }

          // If the bottommost node goes outside the bounds, push it back up.
          dy = y - py - y1;
          if (dy > 0) {
            y = (node.y0 -= dy), node.y1 -= dy;

            // Push any overlapping nodes back up.
            for (i = n - 2; i >= 0; --i) {
              node = nodes[i];
              dy = node.y1 + py - y;
              if (dy > 0) node.y0 -= dy, node.y1 -= dy;
              y = node.y0;
            }
          }
        }

      });
    }
  }

  function computeLinkBreadths(graph) {
    graph.nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetBreadth);
      node.targetLinks.sort(ascendingSourceBreadth);
    });
    graph.nodes.forEach(function(node) {
      var y0 = node.y0, y1 = y0;
      node.sourceLinks.forEach(function(link) {
        link.y0 = y0 + link.width / 2, y0 += link.width;
      });
      node.targetLinks.forEach(function(link) {
        link.y1 = y1 + link.width / 2, y1 += link.width;
      });
    });
  }

  return sankey;
}
