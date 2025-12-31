import React from 'react'
import FormRender from '../components/form/FormRender'
import { useParams } from 'react-router-dom'

const TaskForm = () => {

  const params = useParams()

  const doctype_plural = params.doctype_plural
  const doctype = doctype_plural.slice(0, -1).charAt(0).toUpperCase() + doctype_plural.slice(1, -1)

  console.log(doctype)
  
  return (
    <div><FormRender doctype={doctype}/></div>
  )
}

export default TaskForm