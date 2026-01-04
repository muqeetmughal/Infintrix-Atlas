import React, { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Button,
  Card,
  Row,
  Col,
  ColorPicker,
  Divider,
  Slider,
  Table,
  Typography,
  Space,
  Collapse,
  Tabs,
  Tag,
  Upload,
  Rate,
  TimePicker,
  Cascader,
  TreeSelect,
  Radio,
  Checkbox,
  Mentions,
  Alert
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// Field mapper to map schema fieldtypes to Ant Design components
const FIELD_COMPONENTS = {
  // Basic Input Fields
  'Data': ({ field, ...props }) => (
    <Input 
      placeholder={`Enter ${field.label || field.fieldname}`}
      {...props}
    />
  ),
  
  'Small Text': ({ field, ...props }) => (
    <Input 
      placeholder={`Enter ${field.label || field.fieldname}`}
      maxLength={field.length || 255}
      {...props}
    />
  ),
  
  'Long Text': ({ field, ...props }) => (
    <TextArea 
      rows={4}
      placeholder={`Enter ${field.label || field.fieldname}`}
      {...props}
    />
  ),
  
  'Text Editor': ({ field, ...props }) => (
    <TextArea 
      rows={6}
      placeholder={`Enter ${field.label || field.fieldname}`}
      style={{ minHeight: 200 }}
      {...props}
    />
  ),
  
  'Code': ({ field, ...props }) => (
    <TextArea 
      rows={8}
      placeholder={`Enter ${field.label || field.fieldname}`}
      style={{ fontFamily: 'monospace', fontSize: '12px' }}
      {...props}
    />
  ),
  
  // Selection Fields
  'Select': ({ field, ...props }) => {
    const options = field.options?.split('\n') || [];
    return (
      <Select 
        placeholder={`Select ${field.label || field.fieldname}`}
        allowClear
        {...props}
      >
        {options.map(opt => (
          <Option key={opt} value={opt}>{opt}</Option>
        ))}
      </Select>
    );
  },
  
  'Link': ({ field, loadOptions, ...props }) => {
    const [options, setOptions] = useState([]);
    
    useEffect(() => {
      if (loadOptions && field.options) {
        loadOptions(field.options).then(setOptions);
      }
    }, [field.options, loadOptions]);
    
    return (
      <Select 
        placeholder={`Select ${field.label || field.fieldname}`}
        showSearch
        allowClear
        filterOption={(input, option) =>
          (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
        }
        {...props}
      >
        {options.map(opt => (
          <Option key={opt.value} value={opt.value}>{opt.label}</Option>
        ))}
      </Select>
    );
  },
  
  'MultiSelect': ({ field, ...props }) => {
    const options = field.options?.split('\n') || [];
    return (
      <Select 
        mode="multiple"
        placeholder={`Select ${field.label || field.fieldname}`}
        allowClear
        {...props}
      >
        {options.map(opt => (
          <Option key={opt} value={opt}>{opt}</Option>
        ))}
      </Select>
    );
  },
  
  // Date & Time Fields
  'Date': ({ field, ...props }) => (
    <DatePicker 
      style={{ width: '100%' }}
      {...props}
    />
  ),
  
  'Datetime': ({ field, ...props }) => (
    <DatePicker 
      showTime
      style={{ width: '100%' }}
      {...props}
    />
  ),
  
  'Time': ({ field, ...props }) => (
    <TimePicker 
      style={{ width: '100%' }}
      format="HH:mm"
      {...props}
    />
  ),
  
  // Numeric Fields
  'Int': ({ field, ...props }) => (
    <InputNumber 
      style={{ width: '100%' }}
      min={field.non_negative ? 0 : undefined}
      precision={0}
      {...props}
    />
  ),
  
  'Float': ({ field, ...props }) => (
    <InputNumber 
      style={{ width: '100%' }}
      min={field.non_negative ? 0 : undefined}
      precision={2}
      {...props}
    />
  ),
  
  'Currency': ({ field, ...props }) => (
    <InputNumber 
      style={{ width: '100%' }}
      min={field.non_negative ? 0 : undefined}
      precision={2}
      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={value => value.replace(/\$\s?|(,*)/g, '')}
      {...props}
    />
  ),
  
  'Percent': ({ field, ...props }) => (
    <InputNumber 
      style={{ width: '100%' }}
      min={0}
      max={100}
      precision={field.precision || 0}
      formatter={value => `${value}%`}
      parser={value => value.replace('%', '')}
      {...props}
    />
  ),
  
  // Boolean Fields
  'Check': ({ field, ...props }) => (
    <Switch 
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      {...props}
    />
  ),
  
  // Special Fields
  'Color': ({ field, ...props }) => (
    <ColorPicker 
      showText
      format={field.options || 'hex'}
      {...props}
    />
  ),
  
  'Rating': ({ field, ...props }) => (
    <Rate 
      count={parseInt(field.options) || 5}
      {...props}
    />
  ),
  
  'Attach': ({ field, ...props }) => (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to Upload</Button>
    </Upload>
  ),
  
  'Attach Image': ({ field, ...props }) => (
    <Upload 
      listType="picture-card"
      accept="image/*"
      maxCount={field.max_count || 1}
      {...props}
    >
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
      </div>
    </Upload>
  ),
  
  'Signature': ({ field, ...props }) => (
    <div style={{ border: '1px dashed #d9d9d9', padding: 16, textAlign: 'center' }}>
      <Button type="dashed" icon={<UploadOutlined />}>
        Add Signature
      </Button>
    </div>
  ),
  
  'Barcode': ({ field, ...props }) => (
    <Input 
      placeholder="Scan or enter barcode"
      suffix={<Button type="text" icon={<EyeOutlined />}>Scan</Button>}
      {...props}
    />
  ),
  
  'QR Code': ({ field, ...props }) => (
    <Input 
      placeholder="Enter QR code data"
      suffix={<Button type="text" icon={<EyeOutlined />}>Generate</Button>}
      {...props}
    />
  ),
  
  'Geolocation': ({ field, ...props }) => (
    <Input 
      placeholder="Enter location or click to detect"
      suffix={<Button type="text" icon={<EyeOutlined />}>Detect</Button>}
      {...props}
    />
  ),
  
  // Layout Fields (handled separately)
  'Section Break': () => null,
  'Column Break': () => null,
  'Page Break': () => null,
  
  // Special Components
  'HTML': ({ field, ...props }) => (
    <div 
      dangerouslySetInnerHTML={{ __html: props.value || '' }}
      style={{ border: '1px solid #d9d9d9', padding: 8, minHeight: 100 }}
    />
  ),
  
  'Markdown': ({ field, ...props }) => (
    <TextArea 
      rows={8}
      placeholder="Enter markdown text"
      style={{ fontFamily: 'monospace' }}
      {...props}
    />
  ),
  
  'JSON': ({ field, ...props }) => (
    <TextArea 
      rows={8}
      placeholder="Enter JSON"
      style={{ fontFamily: 'monospace', fontSize: '12px' }}
      {...props}
    />
  ),
  
  'Button': ({ field, ...props }) => (
    <Button 
      type="primary"
      onClick={() => field.onClick && field.onClick()}
      {...props}
    >
      {field.label || field.fieldname}
    </Button>
  ),
};

// Default component for unknown fieldtypes
const DefaultField = ({ field, ...props }) => (
  <Input 
    placeholder={`Enter ${field.label || field.fieldname}`}
    {...props}
  />
);

// Dynamic Form Builder Component
const DynamicFormBuilder = ({ 
  schema, 
  initialValues = {}, 
  onSubmit,
  onValuesChange,
  loadOptions,
  formLayout = 'vertical',
  showSections = true,
  disabled = false,
  readonly = false
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('0');
  const [fieldValues, setFieldValues] = useState({});
  const [visibleFields, setVisibleFields] = useState(new Set());

  // Parse schema and organize fields
  const { sections, tabs } = useMemo(() => {
    if (!schema?.fields) return { sections: [], tabs: [] };
    
    const sections = [];
    const tabs = [];
    let currentSection = null;
    let currentTab = null;
    let currentColumn = null;
    
    schema.fields.forEach((field) => {
      // Handle special field types
      if (field.fieldtype === 'Section Break') {
        currentSection = {
          label: field.label || 'Section',
          fieldname: field.fieldname,
          collapsible: field.collapsible,
          collapsed: field.collapsible_depends_on ? false : field.collapsible,
          fields: [],
          columns: []
        };
        sections.push(currentSection);
        currentColumn = null;
      } 
      else if (field.fieldtype === 'Column Break') {
        if (currentSection) {
          currentColumn = {
            width: field.width || '50%',
            fields: []
          };
          currentSection.columns.push(currentColumn);
        }
      }
      else if (field.fieldtype === 'Tab Break') {
        currentTab = {
          label: field.label || 'Tab',
          fieldname: field.fieldname,
          fields: [],
          columns: []
        };
        tabs.push(currentTab);
        currentColumn = null;
      }
      else {
        // Add field to appropriate container
        const fieldData = {
          ...field,
          dependsOn: field.depends_on,
          mandatoryDependsOn: field.mandatory_depends_on,
          readOnlyDependsOn: field.read_only_depends_on,
          collapsibleDependsOn: field.collapsible_depends_on
        };
        
        if (currentTab) {
          if (currentColumn) {
            currentColumn.fields.push(fieldData);
          } else {
            currentTab.fields.push(fieldData);
          }
        } else if (currentSection) {
          if (currentColumn) {
            currentColumn.fields.push(fieldData);
          } else {
            currentSection.fields.push(fieldData);
          }
        }
      }
    });
    
    return { sections, tabs };
  }, [schema]);

  // Evaluate depends_on expressions
  const evaluateExpression = (expression, values) => {
    if (!expression) return true;
    
    try {
      // Simple expression evaluation
      if (expression.startsWith('eval:')) {
        const expr = expression.replace('eval:', '').trim();
        
        // Handle common expressions
        if (expr.includes('==')) {
          const [field, value] = expr.split('==').map(s => s.trim().replace(/['"]/g, ''));
          return values[field] === value;
        }
        if (expr.includes('!=')) {
          const [field, value] = expr.split('!=').map(s => s.trim().replace(/['"]/g, ''));
          return values[field] !== value;
        }
        if (expr.includes('&&')) {
          const parts = expr.split('&&').map(s => s.trim());
          return parts.every(part => evaluateExpression(part, values));
        }
        if (expr.includes('||')) {
          const parts = expr.split('||').map(s => s.trim());
          return parts.some(part => evaluateExpression(part, values));
        }
        
        // Default: check if field has truthy value
        return !!values[expr];
      }
      
      // Simple field check
      return !!values[expression];
    } catch (error) {
      console.warn('Error evaluating expression:', expression, error);
      return true;
    }
  };

  // Check field visibility
  const isFieldVisible = (field, values) => {
    if (field.hidden) return false;
    if (!field.dependsOn) return true;
    return evaluateExpression(field.dependsOn, values);
  };

  // Check field readonly status
  const isFieldReadOnly = (field, values) => {
    if (field.read_only || readonly) return true;
    if (!field.readOnlyDependsOn) return false;
    return evaluateExpression(field.readOnlyDependsOn, values);
  };

  // Get field required status
  const isFieldRequired = (field, values) => {
    if (field.reqd) return true;
    if (!field.mandatoryDependsOn) return false;
    return evaluateExpression(field.mandatoryDependsOn, values);
  };

  // Get initial value for field
  const getInitialValue = (field) => {
    if (initialValues[field.fieldname] !== undefined) {
      return initialValues[field.fieldname];
    }
    
    if (field.default !== undefined && field.default !== null) {
      // Parse default value based on fieldtype
      switch (field.fieldtype) {
        case 'Check':
          return field.default === '1' || field.default === 'true' || field.default === true;
        case 'Int':
        case 'Float':
        case 'Currency':
        case 'Percent':
          return parseFloat(field.default) || 0;
        case 'Select':
        case 'Link':
          return field.default;
        default:
          return field.default;
      }
    }
    
    return undefined;
  };

  // Render a single field
  const renderField = (field) => {
    if (!isFieldVisible(field, fieldValues)) return null;
    
    const FieldComponent = FIELD_COMPONENTS[field.fieldtype] || DefaultField;
    const isReadOnly = isFieldReadOnly(field, fieldValues);
    const isRequired = isFieldRequired(field, fieldValues);
    
    const rules = [];
    if (isRequired) {
      rules.push({
        required: true,
        message: `Please enter ${field.label || field.fieldname}`
      });
    }
    
    // Add custom validation rules
    if (field.fieldtype === 'Int' || field.fieldtype === 'Float') {
      if (field.non_negative) {
        rules.push({
          validator: (_, value) => {
            if (value === undefined || value === null || value >= 0) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('Value must be non-negative'));
          }
        });
      }
    }
    
    return (
      <Form.Item
        key={field.fieldname}
        name={field.fieldname}
        label={field.label || field.fieldname}
        tooltip={field.description}
        rules={rules}
        initialValue={getInitialValue(field)}
        hidden={field.hidden}
        extra={field.description && <Text type="secondary">{field.description}</Text>}
        style={{
          fontWeight: field.bold ? 'bold' : 'normal',
          marginBottom: field.in_list_view ? 8 : 16
        }}
      >
        <FieldComponent 
          field={field}
          disabled={disabled || isReadOnly}
          readOnly={isReadOnly}
          loadOptions={loadOptions}
          placeholder={field.placeholder || `Enter ${field.label || field.fieldname}`}
        />
      </Form.Item>
    );
  };

  // Render a section
  const renderSection = (section, index) => {
    if (!section.fields.length && !section.columns.length) return null;
    
    const isCollapsed = section.collapsible && !evaluateExpression(section.collapsibleDependsOn, fieldValues);
    
    const content = section.columns.length > 0 ? (
      <Row gutter={24}>
        {section.columns.map((column, colIndex) => (
          <Col 
            key={colIndex} 
            span={parseInt(column.width) || 12}
          >
            {column.fields.map(field => renderField(field))}
          </Col>
        ))}
      </Row>
    ) : (
      <Row gutter={24}>
        {section.fields.map(field => (
          <Col 
            key={field.fieldname} 
            span={field.width ? parseInt(field.width) : 24}
          >
            {renderField(field)}
          </Col>
        ))}
      </Row>
    );
    
    if (!showSections) {
      return <div key={index}>{content}</div>;
    }
    
    return (
      <Collapse.Panel 
        key={section.fieldname || index}
        header={section.label}
        forceRender
        collapsible={section.collapsible ? undefined : 'disabled'}
        defaultActiveKey={isCollapsed ? [] : [section.fieldname || index.toString()]}
      >
        {content}
      </Collapse.Panel>
    );
  };

  // Handle form value changes
  const handleValuesChange = (changedValues, allValues) => {
    setFieldValues(allValues);
    
    // Update visible fields
    const newVisibleFields = new Set();
    [...sections, ...tabs].forEach(container => {
      [...(container.fields || []), ...(container.columns?.flatMap(c => c.fields) || [])]
        .filter(field => isFieldVisible(field, allValues))
        .forEach(field => newVisibleFields.add(field.fieldname));
    });
    setVisibleFields(newVisibleFields);
    
    if (onValuesChange) {
      onValuesChange(changedValues, allValues);
    }
  };

  // Handle form submission
  const handleSubmit = (values) => {
    console.log('Form values:', values);
    
    // Convert values based on field types
    const processedValues = { ...values };
    [...sections, ...tabs].forEach(container => {
      [...(container.fields || []), ...(container.columns?.flatMap(c => c.fields) || [])]
        .forEach(field => {
          if (field.fieldtype === 'Date' && processedValues[field.fieldname]) {
            processedValues[field.fieldname] = dayjs(processedValues[field.fieldname]).format('YYYY-MM-DD');
          }
          if (field.fieldtype === 'Datetime' && processedValues[field.fieldname]) {
            processedValues[field.fieldname] = dayjs(processedValues[field.fieldname]).format('YYYY-MM-DD HH:mm:ss');
          }
        });
    });
    
    if (onSubmit) {
      onSubmit(processedValues);
    }
  };

  // Initialize form values
  useEffect(() => {
    const initialFieldValues = {};
    
    // Set initial values for all fields
    [...sections, ...tabs].forEach(container => {
      [...(container.fields || []), ...(container.columns?.flatMap(c => c.fields) || [])]
        .forEach(field => {
          initialFieldValues[field.fieldname] = getInitialValue(field);
        });
    });
    
    setFieldValues(initialFieldValues);
    form.setFieldsValue(initialFieldValues);
  }, [schema, initialValues]);

  if (!schema?.fields) {
    return (
      <Alert 
        message="No schema provided" 
        description="Please provide a valid schema with fields"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Form
      form={form}
      layout={formLayout}
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      disabled={disabled}
      scrollToFirstError
    >
      {tabs.length > 0 ? (
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
        >
          {tabs.map((tab, index) => (
            <TabPane tab={tab.label} key={index.toString()}>
              {tab.fields.map(field => renderField(field))}
              {tab.columns?.map((column, colIndex) => (
                <Row gutter={24} key={colIndex}>
                  <Col span={parseInt(column.width) || 12}>
                    {column.fields.map(field => renderField(field))}
                  </Col>
                </Row>
              ))}
            </TabPane>
          ))}
        </Tabs>
      ) : showSections && sections.length > 0 ? (
        <Collapse 
          defaultActiveKey={sections
            .filter(s => !s.collapsible || !s.collapsed)
            .map((s, i) => s.fieldname || i.toString())}
          style={{ marginBottom: 24 }}
        >
          {sections.map((section, index) => renderSection(section, index))}
        </Collapse>
      ) : (
        <Row gutter={24}>
          {sections.flatMap(section => 
            [...(section.fields || []), ...(section.columns?.flatMap(c => c.fields) || [])]
              .map(field => (
                <Col 
                  key={field.fieldname} 
                  span={field.width ? parseInt(field.width) : 24}
                >
                  {renderField(field)}
                </Col>
              ))
          )}
        </Row>
      )}

      {/* Table fields (if any) */}
      {schema._table_fields?.map(tableField => {
        if (!isFieldVisible(tableField, fieldValues)) return null;
        
        return (
          <Card 
            key={tableField.fieldname}
            title={tableField.label}
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Form.List name={tableField.fieldname}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      {/* Render table field columns dynamically */}
                      {tableField.fields?.map(colField => {
                        const FieldComponent = FIELD_COMPONENTS[colField.fieldtype] || Input;
                        return (
                          <Form.Item
                            {...restField}
                            key={colField.fieldname}
                            name={[name, colField.fieldname]}
                            label={colField.label}
                            style={{ marginBottom: 0 }}
                          >
                            <FieldComponent
                              field={colField}
                              placeholder={`Enter ${colField.label}`}
                            />
                          </Form.Item>
                        );
                      })}
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Add Row
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        );
      })}

      {/* Form Actions */}
      <Form.Item style={{ marginTop: 24 }}>
        <Row justify="end" gutter={16}>
          <Col>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Col>
          <Col>
            <Button type="primary" htmlType="submit">
              {schema.message?.title_field ? `Save ${schema.message.title_field}` : 'Submit'}
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};

// Main Dynamic Form Component
const DynamicForm = ({ schema, ...props }) => {
  // Extract doctype and fields from schema
  const doctypeSchema = useMemo(() => {
    if (!schema) return null;
    
    // Handle different schema formats
    if (schema.message) {
      // Your format
      return {
        name: schema.message.name,
        label: schema.message.title_field || schema.message.name,
        fields: schema.message.fields || [],
        _table_fields: schema.message._table_fields || []
      };
    } else if (schema.doctype) {
      // Alternative format
      return {
        name: schema.doctype,
        label: schema.label || schema.doctype,
        fields: schema.fields || [],
        _table_fields: schema._table_fields || []
      };
    } else if (Array.isArray(schema)) {
      // Simple array format
      return {
        name: 'Form',
        label: 'Form',
        fields: schema,
        _table_fields: []
      };
    }
    
    return null;
  }, [schema]);

  if (!doctypeSchema) {
    return (
      <Alert 
        message="Invalid schema format"
        description="Schema must contain fields definition"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        {doctypeSchema.label}
      </Title>
      <DynamicFormBuilder 
        schema={doctypeSchema}
        {...props}
      />
    </div>
  );
};

export default DynamicForm;