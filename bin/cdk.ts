import * as cdk from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { ImagebuilderPipeline } from './../lib/imagebuilderpipeline'
import { MainConfig } from './../lib/interface/mainConfig'

// The following imports are needed when you set the props
import * as ec2 from "aws-cdk-lib/aws-ec2";
//import * as s3 from "aws-cdk-lib/aws-s3";
//import * as sns from "aws-cdk-lib/aws-sns";

const app = new cdk.App();

// Define the name of your CloudFormation stack here
const imageBuilderPipelineName: string = "ImagebuilderPipeline";

// Use this variable to define your props.
// There are two examples in the bin/example_props directory.
// This is the basic sample.
let amiConfig: MainConfig = {
    "baseImage": ec2.MachineImage.latestAmazonLinux2023(),
    "componentsPrefix": "components",
    "iamEncryption": true,
    "amitag": {
        "env": "dev",
        "Name": "golden-ami-{{imagebuilder:buildDate}}",
        "Date_Created": "{{imagebuilder:buildDate}}"
    },
    "tag": {
        "env": "dev",
        "Name": "golden-ami-poc"
    },
    "imageRecipe": {
        "imageRecipeVersion": "1.0.0"
    },
    "componentConfig": {
        "Build": [
            {
                "name": "build1",
                "file": "components/build1.yaml",
                "version": "1.0.0",
                "parameter": [
                    {
                        "name": "testparam",
                        "value": [
                            "samplevalue"
                        ]
                    }
                ]
            }
        ],
        "Test": [
            {
                "name": "test1",
                "file": "components/test1.yaml",
                "version": "1.0.0"
            }
        ]
    }
}

const tagEnv = new cdk.Tag('env', 'dev');
const tagName = new cdk.Tag('Name', 'golden-ami-blog-demo');

export class CreateImageBuilder extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        // The props you define above are implicitly passed to this ImagebuilderPipeline instance
        const GOLDEN_AMI_PIPELINE = new ImagebuilderPipeline(
            this,
            imageBuilderPipelineName,
            {
                userConfig: amiConfig!
            }
        );
        new cdk.CfnOutput(this, 'S3bucketName', { value: GOLDEN_AMI_PIPELINE.bucket.bucketName });
        new cdk.CfnOutput(this, 'PipelineName', { value: GOLDEN_AMI_PIPELINE.pipeline.name });
        new cdk.CfnOutput(this, 'ImageRecipeName', { value: GOLDEN_AMI_PIPELINE.recipe.name });
        new cdk.CfnOutput(this, 'ImagePipelineInfraName', { value: GOLDEN_AMI_PIPELINE.infra.name });
        new cdk.CfnOutput(this, 'AMIInstanceProfile', { value: GOLDEN_AMI_PIPELINE.instanceProfileRole.instanceProfileName! });
    }
}

const stack = new CreateImageBuilder(
    app,
    imageBuilderPipelineName, // Define the name of your image builder pipeline via this variable
    {
        env: {
            region: process.env.CDK_DEPLOY_REGION
        }
    }
)
cdk.Tags.of(stack).add(tagEnv.key, tagEnv.value)
cdk.Tags.of(stack).add(tagName.key, tagName.value)
app.synth();
