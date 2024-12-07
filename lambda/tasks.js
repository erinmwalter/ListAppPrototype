const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
};

function validateTask(data) {
  const required = ['taskId', 'groupId', 'description', 'assignedTo'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  if (data.status && !['PENDING', 'COMPLETED'].includes(data.status)) {
    throw new Error('Status must be either PENDING or COMPLETED');
  }
  return {
    taskId: data.taskId,
    groupId: data.groupId,
    description: data.description,
    status: data.status || 'PENDING',
    assignedTo: data.assignedTo,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

exports.handler = async (event) => {
  const { httpMethod, pathParameters } = event;
  const tasksTable = process.env.TASKS_TABLE;

  try {
    switch(httpMethod) {
      case 'POST':
        const taskData = validateTask(JSON.parse(event.body));
        await dynamodb.put({
          TableName: tasksTable,
          Item: taskData
        }).promise();
        return { statusCode: 201, headers, body: JSON.stringify(taskData) };

      case 'GET':
        if (pathParameters?.taskId) {
          const { Item } = await dynamodb.get({
            TableName: tasksTable,
            Key: { 
              taskId: pathParameters.taskId,
              groupId: event.queryStringParameters?.groupId
            }
          }).promise();
          return { statusCode: 200, headers, body: JSON.stringify(Item) };
        } else {
          const { Items } = await dynamodb.scan({ TableName: tasksTable }).promise();
          return { statusCode: 200, headers, body: JSON.stringify(Items) };
        }

      case 'PUT':
        const updateData = validateTask({
          ...JSON.parse(event.body),
          taskId: pathParameters.taskId
        });
        
        await dynamodb.update({
          TableName: tasksTable,
          Key: { 
            taskId: pathParameters.taskId,
            groupId: updateData.groupId
          },
          UpdateExpression: 'set description = :description, status = :status, assignedTo = :assignedTo',
          ExpressionAttributeValues: {
            ':description': updateData.description,
            ':status': updateData.status,
            ':assignedTo': updateData.assignedTo
          }
        }).promise();
        return { statusCode: 200, headers, body: JSON.stringify(updateData) };

      case 'DELETE':
        await dynamodb.delete({
          TableName: tasksTable,
          Key: { 
            taskId: pathParameters.taskId,
            groupId: event.queryStringParameters?.groupId
          }
        }).promise();
        return { statusCode: 204, headers };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported method' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return {
      statusCode: error.name === 'ValidationError' ? 400 : 500,
      headers,
      body: JSON.stringify({ error: error.message, details: error.stack })
    };
  }
};