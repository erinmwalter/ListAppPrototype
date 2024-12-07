# Steps to recreate all of this:
1. create an IAM role with the following permissions (note you can specify a specific resource as well instead of blanket allowing for all resources):
   ```json
   {
    "Effect": "Allow",
    "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "cloudformation:*",
        "s3:*",
        "iam:*",
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "ecr:*",
         "sts:AssumeRole"
    ],
    "Resource": "*"
   }
   ```
2. in a folder, run the following commands to initiate the CDK repo (I used javascript for this but if you are more comfortable with a different language you can use it instead where the XXXXXX is):
   ```bash
   npm install -g aws-cdk
   cdk init app --language XXXXX
   cdk --version
   ```
3. Make sure you have your access key and secret from your IAM role and your region and run the `aws configure` command. Once you have logged in via this method, you will have to do a one-time initial set up using this command : `cdk bootstrap`
4. In the `lib` folder you should have an `appName-stack.js` file, and then in the `bin` folder you should have a `appName.js` file (where appName in both cases is the name of your app's folder.
5. In the  `bin\appName.js` file, uncomment the `env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }` line so that it pulls your default account info and region from your account.
6. In the `lib\appName-stack.js` is where you will add resources that need to be pushed out. I made examples of a s3 bucket, API gateway, DynamoDB, lambda functions, and a static website via S3.
7. For some resources, for instance, a lambda or a website, you will need to add different folders and add the code there. In the lambda folder, for instance, I added my three created lambdas. and in my website folder, I added the index.html, styles.css, and script.js files that make up the website.
