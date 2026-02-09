import { useMemo, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import { Tooltip } from "antd";
import { useTheme } from "../context/ThemeContext";

const getRandomYearValues = (year = 2016, maxCount = 32) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const values = [];

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    values.push({
      date: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`,
      count: Math.floor(Math.random() * (maxCount + 1)),
    });
  }

  return values;
};

const defaultMonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const defaultWeekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HeatmapWidget = ({
  startDate,
  endDate,
  width = "100%",
  height,
  rectSize = 12,
  rectPadding = 2,
  panelColors = [
    "#f3e5f5",
    "#d1c4e9",
    "#b39ddb",
    "#9575cd",
    "#7e57c2",
    "#5e35b1",
  ],
  monthLabels = defaultMonthLabels,
  weekLabels = defaultWeekLabels,
  showMonthLabels = true,
  showWeekLabels = true,
}) => {
  const [selected, setSelected] = useState(null);

  const theme = useTheme();

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const data = useMemo(
    () => getRandomYearValues(selectedYear, 50),
    [selectedYear]
  );

  const computedStartDate = startDate ?? `${selectedYear}/01/01`;
  const computedEndDate = endDate ?? `${selectedYear + 1}/01/01`;

  const labelColor = theme.isDark ? "#e0e0e0" : "#000";
  const heatmapStyle = {
    color: labelColor,
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <HeatMap
        value={data}
        startDate={computedStartDate}
        endDate={computedEndDate}
        width={width}
        height={height}
        rectSize={rectSize}
        rectPadding={rectPadding}
        panelColors={panelColors}
        monthLabels={showMonthLabels ? monthLabels : []}
        weekLabels={showWeekLabels ? weekLabels : []}
        style={heatmapStyle}
        rectRender={(props, data) => {
          if (selected !== "") {
            props.opacity = data.date === selected ? 1 : 0.45;
          }
          return (
            <Tooltip title={`Date: ${data.date} | Count: ${data.count}`}>
              <rect
                {...props}
                onClick={() => {
                  setSelected(data);
                }}
              />
            </Tooltip>
          );
        }}
      />
    </div>
  );
};

export default HeatmapWidget;
