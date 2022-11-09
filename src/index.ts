/**
 * This example shows how to load a GEXF graph file (using the dedicated
 * graphology parser), and display it with some basic map features: Zoom in and
 * out buttons, reset zoom button, and a slider to increase or decrease the
 * quantity of labels displayed on screen.
 */

import Sigma from "sigma";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";

// Load external GEXF file:
fetch("./house17.gexf")
  .then((res) => res.text())
  .then((gexf) => {
    // Parse GEXF string:
    const graph = parse(Graph, gexf);

    // Retrieve some useful DOM elements:
    const container = document.getElementById("sigma-container") as HTMLElement;
    const zoomInBtn = document.getElementById("zoom-in") as HTMLButtonElement;
    const zoomOutBtn = document.getElementById("zoom-out") as HTMLButtonElement;
    const zoomResetBtn = document.getElementById(
      "zoom-reset"
    ) as HTMLButtonElement;
    const labelsThresholdRange = document.getElementById(
      "labels-threshold"
    ) as HTMLInputElement;
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    const searchSuggestions = document.getElementById(
      "suggestions"
    ) as HTMLDataListElement;

    // Instanciate sigma:
    const renderer = new Sigma(graph, container, {
      minCameraRatio: 0.01,
      maxCameraRatio: 3,
      allowInvalidContainer: true,
      renderEdgeLabels: true
    });
    const camera = renderer.getCamera();

    // Bind zoom manipulation buttons
    zoomInBtn.addEventListener("click", () => {
      camera.animatedZoom({ duration: 600 });
    });
    zoomOutBtn.addEventListener("click", () => {
      camera.animatedUnzoom({ duration: 600 });
    });
    zoomResetBtn.addEventListener("click", () => {
      camera.animatedReset({ duration: 600 });
    });

    // Type and declare internal state:
    interface State {
      hoveredNode?: string;
      searchQuery: string;

      // State derived from query:
      selectedNode?: string;
      suggestions?: Set<string>;

      // State derived from hovered node:
      hoveredNeighbors?: Set<string>;
    }
    const state: State = { searchQuery: "" };

    // Feed the datalist autocomplete values:
    searchSuggestions.innerHTML = graph
      .nodes()
      .map(
        (node) =>
          `<option value="${graph.getNodeAttribute(node, "label")}"></option>`
      )
      .join("\n");

    // Actions:
    function setSearchQuery(query: string) {
      state.searchQuery = query;

      if (searchInput.value !== query) searchInput.value = query;

      if (query) {
        const lcQuery = query.toLowerCase();
        const suggestions = graph
          .nodes()
          .map((n) => ({
            id: n,
            label: graph.getNodeAttribute(n, "label") as string
          }))
          .filter(({ label }) => label.toLowerCase().includes(lcQuery));

        // If we have a single perfect match, them we remove the suggestions, and
        // we consider the user has selected a node through the datalist
        // autocomplete:
        if (suggestions.length === 1 && suggestions[0].label === query) {
          state.selectedNode = suggestions[0].id;
          setHoveredNode(suggestions[0].id)
          state.suggestions = undefined;
          clickMode = true
          clickedNode = suggestions[0].id

          // Move the camera to center it on the selected node:
          const nodePosition = renderer.getNodeDisplayData(
            state.selectedNode
          ) as Coordinates;
          renderer.getCamera().animate(nodePosition, {
            duration: 500
          });
        }
        // Else, we display the suggestions list:
        else {
          state.selectedNode = undefined;
          state.suggestions = new Set(suggestions.map(({ id }) => id));
        }
      }
      // If the query is empty, then we reset the selectedNode / suggestions state:
      else {
        state.selectedNode = undefined;
        state.suggestions = undefined;
      }

      // Refresh rendering:
      renderer.refresh();
    }

    function setHoveredNode(node?: string) {
      if (node) {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
      } else {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = undefined;
      }

      // Refresh rendering:
      renderer.refresh();
    }

    // Bind search input interactions:
    searchInput.addEventListener("input", () => {
      setSearchQuery(searchInput.value || "");
    });
    searchInput.addEventListener("blur", () => {
      setSearchQuery("");
    });

    var clickedNode = undefined;
    var clickMode = false;
    // Bind graph interactions:
    renderer.on("clickNode", ({ node }) => {
      if (clickedNode === node) {
        clickedNode = undefined;
        setHoveredNode(undefined);
        clickMode = false;
      } else {
        clickedNode = node;
        clickMode = true;
        setHoveredNode(node);
      }
    });
    renderer.on("enterNode", ({ node }) => {
      if (clickMode === false) {
        setHoveredNode(node);
      }
    });
    renderer.on("leaveNode", ({ node }) => {
      if (clickMode === false) {
        if (clickedNode !== node) {
          setHoveredNode(undefined);
        }
      }
    });
    renderer.on("doubleClickNode", ({ node }) => {
      window.open("https://www.opensecrets.org/search?q=" + node);
    });

    renderer.setSetting("nodeReducer", (node, data) => {
      const res: Partial<NodeDisplayData> = { ...data };

      if (
        state.hoveredNeighbors &&
        !state.hoveredNeighbors.has(node) &&
        state.hoveredNode !== node
      ) {
        res.label = "";
        res.color = "#f6f6f6";
      }

      if (state.selectedNode === node) {
        res.highlighted = true;
      } else if (state.suggestions && !state.suggestions.has(node)) {
        res.label = "";
        res.color = "#f6f6f6";
      }

      if (state.suggestions && state.suggestions.has(node)) {
        res.highlighted = true;
        res.label = graph.getNodeAttribute(node, "label")
        res.color = graph.getNodeAttribute(node, "color")
      }

      return res;
    });

    // Render edges accordingly to the internal state:
    // 1. If a node is hovered, the edge is hidden if it is not connected to the
    //    node
    // 2. If there is a query, the edge is only visible if it connects two
    //    suggestions
    renderer.setSetting("edgeReducer", (edge, data) => {
      const res: Partial<EdgeDisplayData> = { ...data };

      if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
        res.hidden = true;
      }

      if (
        state.suggestions &&
        (!state.suggestions.has(graph.source(edge)) ||
          !state.suggestions.has(graph.target(edge)))
      ) {
        res.hidden = true;
      }

      return res;
    });
  });
