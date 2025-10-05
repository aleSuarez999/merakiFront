import { Cell, Pie, PieChart, Tooltip } from "recharts"

const data2 = [
  
      {name: "online", value: 15},
      {name: "alerting", value: 20},
      {name: "offline", value: 30},
      {name: "dormant", value: 5}
  
]


const COLORS = ["#427947ff", "#e0de55ff", "#b9473fff", "#CCC" ]

const OrgStatusChart = (
  {data}
) => {
  
  return (
      <PieChart width={120} height={120} >
        <Pie data={data} dataKey='value'  > 
          {
            data.map( (entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            )

            )
          }

        </Pie>
        <Tooltip />
      </PieChart>

  )

}

export default OrgStatusChart;