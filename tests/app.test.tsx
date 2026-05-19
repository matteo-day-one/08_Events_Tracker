import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import App from "../src/App";

vi.mock("../src/config", () => ({
  googleMapsApiKey: "",
  googleMapsMapId: undefined,
  repositoryUrl: "https://github.com/your-user/public-event-tracker"
}));

describe("event tracker app", () => {
  it("renders the event directory and filters events by text", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Public Event Tracker" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Clean Energy Summit/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search events"), {
      target: { value: "medical" }
    });

    expect(screen.queryByRole("row", { name: /Clean Energy Summit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeInTheDocument();
  });

  it("renders search plus hierarchical topic and location filters", () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));

    expect(filters.getByLabelText("Search events")).toBeInTheDocument();
    expect(filters.getByRole("button", { name: "Topics All" })).toBeInTheDocument();
    expect(filters.getByRole("button", { name: "Location All" })).toBeInTheDocument();
    expect(filters.queryByRole("button", { name: /^Subtopics / })).not.toBeInTheDocument();
    expect(filters.queryByRole("button", { name: /^Regions / })).not.toBeInTheDocument();
    expect(filters.queryByRole("button", { name: /^Countries / })).not.toBeInTheDocument();
    expect(filters.queryByText("Mode")).not.toBeInTheDocument();
    expect(filters.queryByText("Fee")).not.toBeInTheDocument();
    expect(filters.queryByText("Starts after")).not.toBeInTheDocument();
    expect(filters.queryByText("Deadline before")).not.toBeInTheDocument();
  });

  it("filters with hierarchical topic and location selections, then resets them", () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));
    openFilterDropdown(filters, "Topics");
    fireEvent.click(filters.getByRole("checkbox", { name: "Robotics" }));
    expect(filters.getByRole("button", { name: "Topics Robotics" })).toBeInTheDocument();

    openFilterDropdown(filters, "Location");
    fireEvent.click(filters.getByRole("button", { name: "Show North America countries" }));
    fireEvent.click(filters.getByRole("checkbox", { name: "United States" }));
    expect(filters.getByRole("button", { name: "Location United States" })).toBeInTheDocument();

    expect(screen.queryByRole("row", { name: /Clean Energy Summit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Medical Robotics Workshop/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Automate/ })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Selected event details")).getByRole("heading", { name: "Automate 2026" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("row", { name: /Clean Energy Summit/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Medical Robotics Workshop/ })).toBeInTheDocument();
  });

  it("shares filters between directory and timeline pages", async () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));
    openFilterDropdown(filters, "Topics");
    fireEvent.click(filters.getByRole("checkbox", { name: "Energy" }));
    openFilterDropdown(filters, "Location");
    fireEvent.click(filters.getByRole("button", { name: "Show Europe countries" }));
    fireEvent.click(filters.getByRole("checkbox", { name: "Italy" }));
    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));

    expect(await screen.findByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(screen.getByText("Clean Energy Summit")).toBeInTheDocument();
    expect(screen.queryByText("Medical Robotics Workshop")).not.toBeInTheDocument();
  });

  it("opens subtopics by hover and click, then clears selections", () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));
    openFilterDropdown(filters, "Topics");
    fireEvent.mouseEnter(filters.getByRole("button", { name: "Show Energy subtopics" }));
    expect(filters.getByRole("checkbox", { name: "Batteries" })).toBeInTheDocument();

    fireEvent.click(filters.getByRole("checkbox", { name: "Batteries" }));
    expect(filters.getByRole("button", { name: "Topics Batteries" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(filters.queryByRole("checkbox", { name: "Batteries" })).not.toBeInTheDocument();

    openFilterDropdown(filters, "Topics");
    fireEvent.click(filters.getByRole("button", { name: "Show Energy subtopics" }));
    expect(filters.getByRole("checkbox", { name: "Batteries" })).toBeChecked();

    fireEvent.click(filters.getByRole("button", { name: "Clear Topics" }));
    expect(filters.getByRole("button", { name: "Topics All" })).toBeInTheDocument();
    expect(filters.getByRole("checkbox", { name: "Batteries" })).not.toBeChecked();
  });

  it("selects every child subtopic when a parent topic is checked", () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));
    openFilterDropdown(filters, "Topics");
    fireEvent.click(filters.getByRole("checkbox", { name: "Energy" }));
    fireEvent.click(filters.getByRole("button", { name: "Show Energy subtopics" }));

    expect(filters.getByRole("checkbox", { name: "Batteries" })).toBeChecked();
    expect(filters.getByRole("checkbox", { name: "Solid-state batteries" })).toBeChecked();
    expect(filters.getByRole("checkbox", { name: "High-temperature batteries" })).toBeChecked();
  });

  it("opens only countries for the selected region group", () => {
    render(<App />);

    const filters = within(screen.getByLabelText("Event filters"));
    openFilterDropdown(filters, "Location");
    fireEvent.click(filters.getByRole("button", { name: "Show Europe countries" }));

    expect(filters.getByRole("checkbox", { name: "Italy" })).toBeInTheDocument();
    expect(filters.getByRole("checkbox", { name: "Germany" })).toBeInTheDocument();
    expect(filters.queryByRole("checkbox", { name: "United States" })).not.toBeInTheDocument();
  });

  it("renders a map fallback when the Google Maps key is missing", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Map" }));

    expect(await screen.findByRole("heading", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByText("Google Maps is not configured.")).toBeInTheDocument();
    expect(screen.getByText(/Add VITE_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
  });

  it("opens map event details from the city list without a Google Maps key", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Map" }));

    expect(await screen.findByRole("heading", { name: "Map" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Clean Energy Summit" }));

    const popup = screen.getByRole("dialog", { name: "Clean Energy Summit" });
    expect(within(popup).getByText("Milan, Italy")).toBeInTheDocument();
    expect(within(popup).getByRole("link", { name: "Website" })).toHaveAttribute(
      "href",
      "https://example.org/clean-energy-summit"
    );
  });

  it("shows an empty map state when filtered events are not mappable", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Search events"), {
      target: { value: "Medical Robotics Workshop" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Map" }));

    expect(await screen.findByRole("heading", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByText("No mappable events match the current filters.")).toBeInTheDocument();
    expect(screen.getByText("Online and ambiguous multi-city events are hidden from the map.")).toBeInTheDocument();
  });

  it("opens add proposals in a drawer and returns focus when closed", () => {
    render(<App />);

    const addButton = screen.getByRole("button", { name: "Add event" });
    fireEvent.click(addButton);

    expect(screen.getByRole("dialog", { name: "Add event proposal" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Event name"), {
      target: { value: "Battery Research Demo Day" }
    });
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "https://example.org/battery-demo-day" }
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Bologna, Italy" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Demo day for battery research prototypes and industrial pilots." }
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-11-05" }
    });
    fireEvent.change(screen.getByLabelText("Application deadline"), {
      target: { value: "2026-10-10" }
    });
    fireEvent.change(screen.getByLabelText("Macrotopics"), {
      target: { value: "energy" }
    });
    fireEvent.change(screen.getByLabelText("Subtopics"), {
      target: { value: "batteries" }
    });
    fireEvent.change(screen.getByLabelText("Reason for proposal"), {
      target: { value: "Relevant public event for the energy community." }
    });

    const output = within(screen.getByTestId("proposal-output")).getByRole("textbox");
    const outputValue = (output as HTMLTextAreaElement).value;

    expect(outputValue).toContain("Action: add");
    expect(outputValue).toContain("2026-battery-research-demo-day");
    expect(outputValue).toContain('"macrotopics": [');

    fireEvent.click(screen.getByRole("button", { name: "Close proposal drawer" }));

    expect(screen.queryByRole("dialog", { name: "Add event proposal" })).not.toBeInTheDocument();
    expect(addButton).toHaveFocus();
  });

  it("opens update and delete proposal drawers from the selected event details", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Clean Energy Summit/ }));
    fireEvent.click(screen.getByRole("button", { name: "Update event" }));

    expect(screen.getByRole("dialog", { name: "Update event proposal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target event")).toHaveValue("2026-clean-energy-summit");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Update event proposal" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update event" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));

    expect(screen.getByRole("dialog", { name: "Delete event proposal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target event")).toHaveValue("2026-clean-energy-summit");
  });

  it("renders macro and micro topic chips with deterministic sector colors", () => {
    render(<App />);

    const cleanEnergyRow = screen.getByRole("row", { name: /Clean Energy Summit/ });

    expect(within(cleanEnergyRow).getByText("Energy")).toHaveClass("topic-chip", "topic-chip-macro", "topic-energy");
    expect(within(cleanEnergyRow).getByText("Batteries")).toHaveClass(
      "topic-chip",
      "topic-chip-micro",
      "topic-energy"
    );

    fireEvent.click(screen.getByRole("button", { name: /Clean Energy Summit/ }));
    const details = within(screen.getByLabelText("Selected event details"));

    expect(details.getByText("Energy")).toHaveClass("topic-chip", "topic-chip-macro", "topic-energy");
    expect(details.getByText("Batteries")).toHaveClass("topic-chip", "topic-chip-micro", "topic-energy");
  });
});

function openFilterDropdown(filters: ReturnType<typeof within>, label: string) {
  fireEvent.click(filters.getByRole("button", { name: new RegExp(`^${label} `) }));
}
