const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const headers = {
 'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Headers': 'Content-Type',
 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
};

function validateGroup(data) {
    const required = ['groupId', 'name']; 
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return {
      groupId: data.groupId,
      name: data.name,
      leaderId: data.leaderId || null,
      createdAt: data.createdAt || new Date().toISOString()
    };
   }

exports.handler = async (event) => {
 const { httpMethod, pathParameters } = event;
 const groupsTable = process.env.GROUPS_TABLE;

 try {
   switch(httpMethod) {
     case 'POST':
       const groupData = validateGroup(JSON.parse(event.body));
       await dynamodb.put({
         TableName: groupsTable,
         Item: groupData
       }).promise();
       return { statusCode: 201, headers, body: JSON.stringify(groupData) };

     case 'GET':
       if (pathParameters?.groupId) {
         const { Item } = await dynamodb.get({
           TableName: groupsTable,
           Key: { groupId: pathParameters.groupId }
         }).promise();
         return { statusCode: 200, headers, body: JSON.stringify(Item) };
       } else {
         const { Items } = await dynamodb.scan({ TableName: groupsTable }).promise();
         return { statusCode: 200, headers, body: JSON.stringify(Items) };
       }

     case 'PUT':
       const updateData = validateGroup({
         ...JSON.parse(event.body),
         groupId: pathParameters.groupId
       });
       
       await dynamodb.update({
         TableName: groupsTable,
         Key: { groupId: pathParameters.groupId },
         UpdateExpression: 'set #name = :name, leaderId = :leaderId',
         ExpressionAttributeNames: { '#name': 'name' },
         ExpressionAttributeValues: {
           ':name': updateData.name,
           ':leaderId': updateData.leaderId
         }
       }).promise();
       return { statusCode: 200, headers, body: JSON.stringify(updateData) };

     case 'DELETE':
       await dynamodb.delete({
         TableName: groupsTable,
         Key: { groupId: pathParameters.groupId }
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