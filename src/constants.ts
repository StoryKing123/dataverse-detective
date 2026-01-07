import { TableDefinition, DataType } from './types';

export const MOCK_TABLES: TableDefinition[] = [
  {
    logicalName: 'account',
    displayName: 'Account',
    collectionName: 'accounts',
    primaryKey: 'accountid',
    primaryNameAttribute: 'name',
    description: 'Business entity that represents a customer or potential customer.',
    isCustom: false,
    columns: [
      { logicalName: 'accountid', displayName: 'Account', dataType: DataType.Uniqueidentifier, requiredLevel: 'SystemRequired' },
      { logicalName: 'name', displayName: 'Account Name', dataType: DataType.String, maxLength: 160, requiredLevel: 'ApplicationRequired' },
      { logicalName: 'accountnumber', displayName: 'Account Number', dataType: DataType.String, maxLength: 20, requiredLevel: 'None' },
      { logicalName: 'primarycontactid', displayName: 'Primary Contact', dataType: DataType.Lookup, targets: 'contact', requiredLevel: 'None' },
      { logicalName: 'telephone1', displayName: 'Main Phone', dataType: DataType.String, maxLength: 50, requiredLevel: 'None' },
      { logicalName: 'revenue', displayName: 'Annual Revenue', dataType: DataType.Money, requiredLevel: 'None' },
      { logicalName: 'description', displayName: 'Description', dataType: DataType.Memo, maxLength: 2000, requiredLevel: 'None' },
      { 
        logicalName: 'statecode', 
        displayName: 'Status', 
        dataType: DataType.Picklist, 
        requiredLevel: 'SystemRequired',
        options: [
          { label: 'Active', value: 0 },
          { label: 'Inactive', value: 1 }
        ]
      },
    ]
  },
  {
    logicalName: 'contact',
    displayName: 'Contact',
    collectionName: 'contacts',
    primaryKey: 'contactid',
    primaryNameAttribute: 'fullname',
    description: 'Person with whom a business unit has a relationship, such as customer, supplier, or colleague.',
    isCustom: false,
    columns: [
      { logicalName: 'contactid', displayName: 'Contact', dataType: DataType.Uniqueidentifier, requiredLevel: 'SystemRequired' },
      { logicalName: 'firstname', displayName: 'First Name', dataType: DataType.String, maxLength: 50, requiredLevel: 'None' },
      { logicalName: 'lastname', displayName: 'Last Name', dataType: DataType.String, maxLength: 50, requiredLevel: 'ApplicationRequired' },
      { logicalName: 'emailaddress1', displayName: 'Email', dataType: DataType.String, maxLength: 100, requiredLevel: 'None' },
      { logicalName: 'parentcustomerid', displayName: 'Company Name', dataType: DataType.Lookup, targets: 'account', requiredLevel: 'None' },
      { 
        logicalName: 'jobtitle', 
        displayName: 'Job Title', 
        dataType: DataType.String, 
        maxLength: 100, 
        requiredLevel: 'None' 
      },
      {
        logicalName: 'preferredcontactmethodcode',
        displayName: 'Preferred Method',
        dataType: DataType.Picklist,
        requiredLevel: 'None',
        options: [
          { label: 'Any', value: 1 },
          { label: 'Email', value: 2 },
          { label: 'Phone', value: 3 },
          { label: 'Fax', value: 4 },
          { label: 'Mail', value: 5 }
        ]
      }
    ]
  },
  {
    logicalName: 'opportunity',
    displayName: 'Opportunity',
    collectionName: 'opportunities',
    primaryKey: 'opportunityid',
    primaryNameAttribute: 'name',
    description: 'Potential revenue-generating event, or sale to an account.',
    isCustom: false,
    columns: [
      { logicalName: 'opportunityid', displayName: 'Opportunity', dataType: DataType.Uniqueidentifier, requiredLevel: 'SystemRequired' },
      { logicalName: 'name', displayName: 'Topic', dataType: DataType.String, maxLength: 300, requiredLevel: 'ApplicationRequired' },
      { logicalName: 'estimatedvalue', displayName: 'Est. Revenue', dataType: DataType.Money, requiredLevel: 'None' },
      { 
        logicalName: 'statuscode', 
        displayName: 'Status Reason', 
        dataType: DataType.Picklist, 
        requiredLevel: 'SystemRequired',
        options: [
          { label: 'In Progress', value: 1 },
          { label: 'On Hold', value: 2 },
          { label: 'Won', value: 3 },
          { label: 'Canceled', value: 4 },
          { label: 'Out-Sold', value: 5 }
        ]
      },
      { logicalName: 'customerid', displayName: 'Potential Customer', dataType: DataType.Lookup, targets: 'account,contact', requiredLevel: 'ApplicationRequired' },
    ]
  },
  {
    logicalName: 'new_custom_project',
    displayName: 'Project Request',
    collectionName: 'new_custom_projects',
    primaryKey: 'new_custom_projectid',
    primaryNameAttribute: 'new_name',
    description: 'Internal tracking for project initialization requests.',
    isCustom: true,
    columns: [
      { logicalName: 'new_custom_projectid', displayName: 'Project Request', dataType: DataType.Uniqueidentifier, requiredLevel: 'SystemRequired' },
      { logicalName: 'new_name', displayName: 'Project Name', dataType: DataType.String, maxLength: 100, requiredLevel: 'ApplicationRequired' },
      { logicalName: 'new_budget', displayName: 'Approved Budget', dataType: DataType.Money, requiredLevel: 'None' },
      { logicalName: 'new_is_urgent', displayName: 'Urgent?', dataType: DataType.Boolean, requiredLevel: 'None' },
      {
        logicalName: 'new_priority',
        displayName: 'Priority',
        dataType: DataType.Picklist,
        requiredLevel: 'ApplicationRequired',
        options: [
          { label: 'Low', value: 100000000 },
          { label: 'Medium', value: 100000001 },
          { label: 'High', value: 100000002 },
          { label: 'Critical', value: 100000003 }
        ]
      }
    ]
  }
];

export const ENV_URL_PLACEHOLDER = "org123456";