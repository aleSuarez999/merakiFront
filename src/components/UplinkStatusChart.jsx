import { Cell, Pie, PieChart, Tooltip } from "recharts"

const data2 = [
  
      {name: "online", value: 15},
      {name: "alerting", value: 20},
      {name: "offline", value: 30},
      {name: "dormant", value: 5}
  
]


//const COLORS = ["#427947ff", "#b9473fff" ]
//const COLORS = ["#427947ff", "#FF0000" ]
//const COLORS = ["#13a10eff", "#e00505dd" ]
const COLORS = ["#24c024ff", "#e0de55ff", "#b9473fff", "#CCC"]
const UplinkStatusChart = ({ data }) => (
  <PieChart width={120} height={120}>
    <Pie data={data} dataKey='value'>
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
)

export default UplinkStatusChart;