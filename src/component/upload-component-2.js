import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Upload, Button, message, Table } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleFilled } from '@ant-design/icons';
// import { dialog } from '../functions/alert';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Text from 'antd/lib/typography/Text';


export function saveFile (url, file, isAuth) {
  return new Promise((resolve, reject) => {
    let body = new FormData();
    body.append('file', file);
    axios.post(url, body).then(res => {
      resolve(res);
    }).catch(err => reject(err));
  });
};

UploadComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  value: PropTypes.any,
  url: PropTypes.string.isRequired,
  uploadFn: PropTypes.func,
  disabled: PropTypes.bool,
  fluidBtn: PropTypes.bool,
  classBtn: PropTypes.string,
  splitUpload: PropTypes.bool,
  showDesc: PropTypes.bool,
  showPreview: PropTypes.bool,
  previewStyle: PropTypes.object
};


UploadComponent.defaultProps  = {
  title: 'Upload File',
  onChange: () => {},
  onError: () => {},
  onRemove: () => {},
  maxSize: 1,
  url: '',
  uploadFn: saveFile,
  splitUpload: false,
  showDesc: false,
  showPreview: false,
  previewStyle: {}
}

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsBinaryString(img);
}

function UploadComponent({ 
  value,
  title,
  onChange,
  onRemove,
  accept,
  maxSize,
  url,
  uploadFn,
  disabled,
  fluidBtn,
  classBtn,
  splitUpload,
  showDesc,
  showPreview,
  previewStyle,
  onInputData,
  ...props
}) {
  const [fileList, setFileList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!!value) {
      setFileList(value.fileList || []);
    }
  }, [value]);

  const handleChange = async (info) => {
    // console.log('uploadProps ', props)
    setIsLoading(true);
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    newFileList = newFileList.map((file) => {
      if(file.size / 1024 / 1024 > (maxSize)){
        file.name = "File terlalu besar";
        file.response = "File tidak dapat diunggah";
        file.status = "error";
        // dialog({icon:'error', title: 'File terlalu besar', text: `Ukuran file harus < ${maxSize} MB`})
        onChange(null);
      } 
      return file;  
    });
    
    if (newFileList.length > 0 && newFileList[0].status !== "error") {
      getBase64(newFileList[0].originFileObj, url => {
        const wb = XLSX.read(url, {type:'binary'});
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // const data = XLSX.utils.sheet_to_csv(ws, {header:1});
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        onInputData(data);
      });
      // try {
      //   const uploadRes = await uploadFn(url, newFileList[0].originFileObj, props.isAuth);
      //   message.success({content: 'File berhasil diunggah', top: "100px"})
      //   delete newFileList[0].originFileObj;
      //   onChange({fileName: uploadRes.data.fileName, fileList: newFileList});
      // } catch (err) {
      //   // const {data} = err.response;
      //   newFileList[0].status = "error";
      //   newFileList[0].response = err.response ? err.response.data.message : err.message;
      //   message.error({content: 'File gagal diunggah', top: "100px"})
      //   onChange(null)
      // }
    }
    setFileList(newFileList);
    setIsLoading(false);
  };

  const handleRemove = (info) => {
    onChange('');
    setFileList([]);
  };

  const uploadProps = {
    beforeUpload: file => {
      // console.log(file)
      return false;
    },
    onChange: event => { handleChange(event); },
    onRemove: event => { handleRemove(event) },
    fileList: fileList,
    multiple: false
  };

  return (
    <div>
      <Upload {...uploadProps} iconRender={''} accept={accept} >
        <Button style={{marginBottom: '1em'}} disabled={disabled || isLoading} style={{width: fluidBtn ? "100%" : "auto", padding: "5px 20px", height: "auto"}}>
          {isLoading ? <LoadingOutlined /> : <UploadOutlined />} {title}
          {!!value && <CheckCircleFilled style={{ color: '#27ae60' }} />}
        </Button>
      </Upload>
      {!value && showDesc && <Text style={{color: 'rgb(172, 172, 172)'}}> Ukuran file max {maxSize} MB</Text>}
      {/* {value && imgUrl && showPreview && (
        <div style={{padding: '.5em', border: '1px solid #dddddd', textAlign: 'center', borderRadius: '4px', height: '200px',  width: '100%', marginTop: '.5em', ...previewStyle}}>
          <div style={{width: '100%', height: '100%', textAlign: 'center', overflow: 'hidden'}}>
            <img src={imgUrl} alt="Preview" style={{height: '100%'}} />
          </div>
        </div>
      )} */}
      {/* {data && (
        <div style={{width: '100%', marginTop: '2em'}}>
          <Table bordered={true} columns={column} dataSource={data} pagination={false}></Table>
        </div>
      )} */}
    </div>
  );
}

export default UploadComponent;


/*
  CONTOH PENGGUNAAN

  <Form>
    <Form.Item
      name="suratPemandian"
      rules={[{required: true, message: 'Surat Pemandian harus diinput' }]}
    >
      <UploadComponent 
        url={CONFIG.BASE_URL_NOAUTH+'/api/upload/foto'}
        title="Upload Surat Pemandian"
        onChange={_ => {}}
      />
    </Form.Item>
  </Form>
*/



// var name = f.name;
// const reader = new FileReader();
// reader.onload = (evt) => { // evt = on_file_select event
//     /* Parse data */
//     const bstr = evt.target.result;
//     const wb = XLSX.read(bstr, {type:'binary'});
//     /* Get first worksheet */
//     const wsname = wb.SheetNames[0];
//     const ws = wb.Sheets[wsname];
//     /* Convert array of arrays */
//     const data = XLSX.utils.sheet_to_csv(ws, {header:1});
//     /* Update state */
//     console.log("Data>>>"+data);
// };
// reader.readAsBinaryString(f);