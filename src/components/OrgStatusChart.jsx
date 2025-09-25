import { Pie, PieChart } from "recharts"

const data = [
  
      {name: "online", value: 15},
      {name: "alerting", value: 20},
      {name: "offline", value: 30},
      {name: "dormant", value: 5}
  
]


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#F44236"]

const OrgStatusChart = () => {
  
  return (
      <PieChart width={150} height={150} >
        <Pie data={data} dataKey='value' />

      </PieChart>

  )

}

export default OrgStatusChart;