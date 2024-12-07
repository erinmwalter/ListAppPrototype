const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const headers = {
 'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Headers': 'Content-Type',
 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
};

function validateUser(data) {
    const required = ['userId', 'name', 'email', 'role'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return {
      userId: data.userId,
      groupId: data.groupId || null,
      name: data.name,
      email: data.email,
      role: data.role
    };
   }

exports.handler = async (event) => {
 const { httpMethod, pathParameters } = event;
 const usersTable = process.env.USERS_TABLE;

 try {
   switch(httpMethod) {
     case 'POST':
       const userData = validateUser(JSON.parse(event.body));
       await dynamodb.put({
         TableName: usersTable,
         Item: userData
       }).promise();
       return { statusCode: 201, headers, body: JSON.stringify(userData) };

     case 'GET':
       if (pathParameters?.userId) {
         const { Item } = await dynamodb.get({
           TableName: usersTable,
           Key: { 
             userId: pathParameters.userId,
             groupId: event.queryStringParameters?.groupId
           }
         }).promise();
         return { statusCode: 200, headers, body: JSON.stringify(Item) };
       } else {
         const { Items } = await dynamodb.scan({ TableName: usersTable }).promise();
         return { statusCode: 200, headers, body: JSON.stringify(Items) };
       }

     case 'PUT':
       const updateData = validateUser({
         ...JSON.parse(event.body),
         userId: pathParameters.userId
       });
       
       await dynamodb.update({
         TableName: usersTable,
         Key: { 
           userId: pathParameters.userId,
           groupId: updateData.groupId
         },
         UpdateExpression: 'set #name = :name, email = :email, #role = :role',
         ExpressionAttributeNames: {
           '#name': 'name',
           '#role': 'role'
         },
         ExpressionAttributeValues: {
           ':name': updateData.name,
           ':email': updateData.email,
           ':role': updateData.role
         }
       }).promise();
       return { statusCode: 200, headers, body: JSON.stringify(updateData) };

     case 'DELETE':
       await dynamodb.delete({
         TableName: usersTable,
         Key: { 
           userId: pathParameters.userId,
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