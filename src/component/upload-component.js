import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

export default function UploadComponent({ 
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
  ...props
}) {
  const [fileList, setFileList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState();

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
        onChange(null)
      } 
      return file;  
    });
    if (newFileList.length > 0 && newFileList[0].status !== "error") {
      try {
        const uploadRes = await uploadFn(url, newFileList[0].originFileObj, props.isAuth);
        getBase64(newFileList[0].originFileObj, url => setImgUrl(url));
        message.success({content: 'File berhasil diunggah', top: "100px"})
        delete newFileList[0].originFileObj;
        onChange({fileName: uploadRes.data.fileName, fileList: newFileList});
      } catch (err) {
        // const {data} = err.response;
        newFileList[0].status = "error";
        newFileList[0].response = err.response ? err.response.data.message : err.message;
        message.error({content: 'File gagal diunggah', top: "100px"})
        onChange(null)
      }
    }
    setFileList(newFileList);
    setIsLoading(false);
  }

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
    onRemove: event => { handleRemove(event); },
    fileList: fileList,
    multiple: false
  };
  
  return (
    <div>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>Click to Upload</Button>
      </Upload>
    </div>
  )
}
