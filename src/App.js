import React, {useEffect, useState} from 'react';
import 'antd/dist/antd.css';
import { Button, Table } from 'antd';
import UploadComponent from './component/upload-component-2';
import axios from 'axios';
const { getJsDateFromExcel } = require("excel-date-to-js");

const column = [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Tasks',
    dataIndex: 'tasks',
    key: 'tasks',
    render: (t, r, i) => (
      <RenderTasks task={r.tasks} />
    ),
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
  },
  {
    title: 'Task ID',
    dataIndex: 'taskId',
    key: 'taskId',
    
  },
];

const toDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export default function App() {
  const [data, setData] = useState(null);
  const [wrData, setWrData] = useState([]);
  const [log, setLog] = useState('');
  const [requestParam, setRequestParam] = useState();
  const [token, setToken] = useState('');
  
  useEffect(_ => {
    setToken('eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b255aGF6YW1hNDcyMUBnbWFpbC5jb20iLCJhdXRob3JpdGllcyI6WyIyIl0sImlhdCI6MTY0MjA5MjY1MSwiZXhwIjoxNjQyMTc5MDUxfQ.jani8HSQkqmt_i4GtVF-EurE5t-iSDNyIA_7KI9Azbcs8qG1eiWxbzNkzjMkRlXJ14YidJmB0H08CHcwaEU36A');
  }, [])

  useEffect(_ => {
    if (requestParam) {
      getData(requestParam[0], requestParam[1]);
    }
  }, [requestParam]);

  const handleChange = (rawData) => {
    console.log({rawData});
    let newData = rawData.filter(e => (e.length > 1 && !!e[1])).map(e => {
      const newDate = toDate(getJsDateFromExcel(e[0]));
      // const wrTask = wrData.find(e => toDate(e.date) === newDate) || {};
      return {
        date: newDate,
        // taskId: wrTask.workingReportId,
        tasks: e[1].split(/\r?\n/).filter(e => !!e).map(j => {
          let task = j.split(' - ');
          task[1] = parseFloat(task[1]);
          return task;
        }),
        location: e[2]
      };
    });
    setData(newData);
    setRequestParam([newData[0].date,newData[newData.length - 1].date]);
  };

  const getData = (start, end) => {
    let config = {
      headers: {
        Authentication: token,
      }
    };
    axios.get(`https://wr.tujuhsembilan.com/wr-be/workingReport?employeeId=26&startDate=${start}&endDate=${end}`, config).then(res => {
      const newWrData = res.data.data || [];
      let newData = data.map(e => {
        const wrTask = newWrData.find(wd => toDate(wd.date) === e.date) || {};
        return {
          ...e,
          taskId: wrTask.workingReportId
        };
      });
      setWrData(newWrData);
      setData(newData);
    });
  };

  const updateWr = async (wrId, date, location) => {
    return new Promise(async (resolve, reject) => {

      let config = {
        headers: {
          Authentication: token,
        }
      };
      
      const data = {
        "workingReportId": wrId,
        "date": date,
        "startTime": "08:00:00",
        "endTime": "17:00:00",
        "location": location,
        "categoryCodeId": 1,
        "holiday": false
    };
      setLog(prevLog => prevLog + `^ Updating WR ${wrId} ...\n`);
      try {
        await axios.put(`https://wr.tujuhsembilan.com/wr-be/workingReport/update?modelID=workingReportId:${wrId}`, data, config);
        setLog(prevLog => prevLog + `v WR ${wrId} updated.\n`);
      } catch (err) {
        setLog(prevLog => prevLog + `! Failed to update WR ${wrId}.\n`);
      }
      resolve();
    });
  };

  const uploadTask = async (taskId, taskTitle, duration, index) => {
    return new Promise(async (resolve, reject) => {

      let config = {
        headers: {
          Authentication: token,
        }
      };
      
      const data ={
        "workingReportId": taskId,
        "jobGroupId": 372,
        "taskItem": taskTitle,
        "duration": duration,
        "isOvertime": false
      };
      setLog(prevLog => prevLog + `? Creating task ${taskId}#${index} ...\n`);
      try {
        const createTaskRes = await axios.post(`https://wr.tujuhsembilan.com/wr-be/task/create`, data, config);
        setLog(prevLog => prevLog + `+ Task ${taskId}#${index} Created.\n`);
      } catch (err) {
        setLog(prevLog => prevLog + `! Failed to create task ${taskId}#${index}.\n`);
      }
      resolve();
    });
  };

  const deleteTask = async (taskId, wrId, index) => {
    return new Promise(async (resolve, reject) => {
      let config = {
        headers: {
          Authentication: token,
        }
      };

      setLog(prevLog => prevLog + `/ Deleting task ${taskId} (${wrId}#${index}) ...\n`);
      try {
        await axios.delete(`https://wr.tujuhsembilan.com/wr-be/task/delete?modelID=taskId:${taskId}`, config);
        setLog(prevLog => prevLog + `- Task ${taskId} (${wrId}#${index}) Deleted.\n`);
      } catch (err) {
        setLog(prevLog => prevLog + `! Failed to delete task ${taskId} (${wrId}#${index}).\n`);
      }
      resolve();
    });
  };
  
  const processTasks = () => {

    wrData.forEach(({regularTasks, workingReportId}) => {
      regularTasks.forEach(async (task, i) => {
        await deleteTask(task.taskId, workingReportId, i);
      });
    });

    data.forEach(async ({tasks, taskId, location, date}) => {
      const wrDate = (new Date(date)).getTime();
      await updateWr(taskId, wrDate, location);
      tasks.forEach(async (task, i) => {
        await uploadTask(taskId, task[0], task[1], i);
      });
    });

  }


  return (
    <div style={{height: '100%'}}>
      <div style={{display: 'flex', flexWrap: 'wrap'}}>
        <UploadComponent onInputData={handleChange} />
      </div>
      <div style={{width: '100%', margin: '2em 0'}}>
        <Table bordered={true} columns={column} dataSource={data} pagination={false}></Table>
      </div>
      <Button onClick={processTasks}>
        Upload Data
      </Button>
      <div style={{marginTop: '1em', padding: '.5em 1em', borderRadius: '4px', background: '#eeeeee'}}>
        <h4 style={{fontWeight: 'bold'}}>Logs</h4>
        <pre>{log}</pre>
      </div>
    </div>
  )
}


const RenderTasks = ({task}) => {
  return (
    <>
      {task.map(e => (
        <tr>
          <td>{e[0]} / {e[1]} Jam</td>
        </tr>
      ))}
    </>
  )
};