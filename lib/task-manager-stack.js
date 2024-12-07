const cdk = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');

class TaskManagerStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const groupsTable = new dynamodb.Table(this, 'Groups', {
      partitionKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      attributeDefinitions: [
        { name: 'groupId', type: dynamodb.AttributeType.STRING }
      ]
    });

    const usersTable = new dynamodb.Table(this, 'Users', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      attributeDefinitions: [
        { name: 'userId', type: dynamodb.AttributeType.STRING },
        { name: 'groupId', type: dynamodb.AttributeType.STRING }
      ]
    });

    const tasksTable = new dynamodb.Table(this, 'Tasks', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      attributeDefinitions: [
        { name: 'taskId', type: dynamodb.AttributeType.STRING },
        { name: 'groupId', type: dynamodb.AttributeType.STRING }
      ]
    });

    // Lambda Functions
    const groupsLambda = new lambda.Function(this, 'GroupsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'groups.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        GROUPS_TABLE: groupsTable.tableName
      }
    });

    const usersLambda = new lambda.Function(this, 'UsersLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'users.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        USERS_TABLE: usersTable.tableName
      }
    });

    const tasksLambda = new lambda.Function(this, 'TasksLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'tasks.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TASKS_TABLE: tasksTable.tableName
      }
    });

    // Grant permissions
    groupsTable.grantReadWriteData(groupsLambda);
    usersTable.grantReadWriteData(usersLambda);
    tasksTable.grantReadWriteData(tasksLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'TaskManagerApi',
      {
        defaultCorsPreflightOptions: {
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization'],
          allowCredentials: false
        }
      }
    );

    const groups = api.root.addResource('groups');
    const group = groups.addResource('{groupId}');
    groups.addMethod('POST', new apigateway.LambdaIntegration(groupsLambda));
    groups.addMethod('GET', new apigateway.LambdaIntegration(groupsLambda));
    group.addMethod('GET', new apigateway.LambdaIntegration(groupsLambda));
    group.addMethod('PUT', new apigateway.LambdaIntegration(groupsLambda));
    group.addMethod('DELETE', new apigateway.LambdaIntegration(groupsLambda));

    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');
    users.addMethod('POST', new apigateway.LambdaIntegration(usersLambda));
    users.addMethod('GET', new apigateway.LambdaIntegration(usersLambda));
    user.addMethod('GET', new apigateway.LambdaIntegration(usersLambda));
    user.addMethod('PUT', new apigateway.LambdaIntegration(usersLambda));
    user.addMethod('DELETE', new apigateway.LambdaIntegration(usersLambda));

    const tasks = api.root.addResource('tasks');
    const task = tasks.addResource('{taskId}');
    tasks.addMethod('POST', new apigateway.LambdaIntegration(tasksLambda));
    tasks.addMethod('GET', new apigateway.LambdaIntegration(tasksLambda));
    task.addMethod('GET', new apigateway.LambdaIntegration(tasksLambda));
    task.addMethod('PUT', new apigateway.LambdaIntegration(tasksLambda));
    task.addMethod('DELETE', new apigateway.LambdaIntegration(tasksLambda));

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      publicReadAccess: true
    });
    
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket: websiteBucket
    });
  }
}

module.exports = { TaskManagerStack }