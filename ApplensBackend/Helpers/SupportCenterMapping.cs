﻿using System;
using System.Collections.Generic;

namespace AppLensV3.Helpers
{
    public static class SupportCenterMapping
    {
        public static Dictionary<string, Tuple<string, string>> Mapping = new Dictionary<string, Tuple<string, string>>()
        {
            { @"Kubernetes Service\Cannot connect to my cluster", new Tuple<string, string>("16450", "32633457") },
            { @"Kubernetes Service\Cannot connect to my cluster\I am unable to connect to my cluster", new Tuple<string, string>("16450", "32633461") },
            { @"Kubernetes Service\Cannot connect to my cluster\I have an issue with my ingress controller", new Tuple<string, string>("16450", "32633468") },
            { @"Kubernetes Service\Cannot connect to my cluster\I have an issue with my load balancer", new Tuple<string, string>("16450", "32633469") },
            { @"Kubernetes Service\Cannot connect to my cluster\My problem is not listed above", new Tuple<string, string>("16450", "32633472") },
            { @"Kubernetes Service\Cannot manage my cluster", new Tuple<string, string>("16450", "32633458") },
            { @"Kubernetes Service\Cannot manage my cluster\I have an issue deleting my cluster", new Tuple<string, string>("16450", "32633463") },
            { @"Kubernetes Service\Cannot manage my cluster\I have an issue managing with kubectl", new Tuple<string, string>("16450", "32633464") },
            { @"Kubernetes Service\Cannot manage my cluster\I have an issue managing with the Kubernetes dashboard", new Tuple<string, string>("16450", "32633465") },
            { @"Kubernetes Service\Cannot manage my cluster\I have an issue scaling my cluster", new Tuple<string, string>("16450", "32633466") },
            { @"Kubernetes Service\Cannot manage my cluster\I have an issue upgrading my cluster", new Tuple<string, string>("16450", "32633467") },
            { @"Kubernetes Service\Cannot manage my cluster\My cluster is unresponsive", new Tuple<string, string>("16450", "32633471") },
            { @"Kubernetes Service\Cannot manage my cluster\My problem is not listed above", new Tuple<string, string>("16450", "32633473") },
            { @"Kubernetes Service\General Guidance or Advisory", new Tuple<string, string>("16450", "32613313") },
            { @"Kubernetes Service\Security and Identity", new Tuple<string, string>("16450", "32633459") },
            { @"Kubernetes Service\Security and Identity\RBAC and Azure Active Directory", new Tuple<string, string>("16450", "32633475") },
            { @"Kubernetes Service\Storage", new Tuple<string, string>("16450", "32633460") },
            { @"Kubernetes Service\Storage\I am unable to create or mount Kubernetes volume claims", new Tuple<string, string>("16450", "32633462") },
            { @"Kubernetes Service\Storage\I received an error using Azure blob storage", new Tuple<string, string>("16450", "32633470") },
            { @"Kubernetes Service\Storage\My problem is not listed above", new Tuple<string, string>("16450", "32633474") },
            { @"API Management Service", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Advisory", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Cannot add or update API for product", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Cannot import APIs", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Cannot sign in to portal", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Forgot password", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Password reset does not work", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Problems with changing policy", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Problems with email notifications", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\API Management Portal (*.apimgmt.windows.net)\Questions about analytics or dashboard data", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\Cannot provision service", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\Cannot sign in to portal", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\Errors or exceptions", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\Issues with changing billing units", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\Migration across subscription", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Azure Management Portal\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Development", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Development\Management API for API management service", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Development\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Documentation", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Documentation\Clarification is needed", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Documentation\Incorrect or missing documentation", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Documentation\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Other", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Runtime", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Runtime\API always returns cache values", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Runtime\Calls are being unexpectedly throttled", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Runtime\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\Authorization errors", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\Cannot connect to an API endpoint", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\DNS issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\High latency", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\My issue is not listed here", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\Performance and latency", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"API Management Service\Service Availability and Connectivity\Service outage", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Function App", new Tuple<string, string>("16072", "supportTopicId") },
            { @"Function App\Adding Functions to a Function App", new Tuple<string, string>("16072", "32518041") },
            { @"Function App\Adding Functions\Creating functions from scratch", new Tuple<string, string>("16072", "32518054") },
            { @"Function App\Adding Functions\Creating functions from source control", new Tuple<string, string>("16072", "32518055") },
            { @"Function App\Authentication and Authorization", new Tuple<string, string>("16072", "32607511") },
            { @"Function App\Authentication and Authorization\App Service Built-in Authentication through Portal", new Tuple<string, string>("16072", "32607515") },
            { @"Function App\Authentication and Authorization\Authentication through Custom Code", new Tuple<string, string>("16072", "32607516") },
            { @"Function App\Authentication and Authorization\Managed Service Identity (MSI) Integration", new Tuple<string, string>("16072", "32608573") },
            { @"Function App\Availability", new Tuple<string, string>("16072", "32598331") },
            { @"Function App\Availability\Function App down or reporting errors", new Tuple<string, string>("16072", "32630466") },
            { @"Function App\Availability\Function App restarted", new Tuple<string, string>("16072", "32630467") },
            { @"Function App\Availability\Messaging function failed to trigger", new Tuple<string, string>("16072", "32630468") },
            { @"Function App\Availability\Timer trigger function failed to trigger", new Tuple<string, string>("16072", "32630471") },
            { @"Function App\Configuring and Managing Function Apps", new Tuple<string, string>("16072", "32518042") },
            { @"Function App\Configuring and Managing Function Apps\Configuring API metadata", new Tuple<string, string>("16072", "32518046") },
            { @"Function App\Configuring and Managing Function Apps\Configuring continuous integration (CI)", new Tuple<string, string>("16072", "32518048") },
            { @"Function App\Configuring and Managing Function Apps\Configuring Cross-Origin Resource Sharing (CORS)", new Tuple<string, string>("16072", "32518049") },
            { @"Function App\Configuring and Managing Function Apps\Configuring memory", new Tuple<string, string>("16072", "32518050") },
            { @"Function App\Configuring and Managing Function Apps\Configuring triggers, inputs, and outputs", new Tuple<string, string>("16072", "32518051") },
            { @"Function App\Configuring and Managing Function Apps\Custom Domain", new Tuple<string, string>("16072", "32630463") },
            { @"Function App\Configuring and Managing Function Apps\Deployment Slots", new Tuple<string, string>("16072", "32630465") },
            { @"Function App\Configuring and Managing Function Apps\Moving a Function App", new Tuple<string, string>("16072", "32598329") },
            { @"Function App\Configuring and Managing Function Apps\SSL", new Tuple<string, string>("16072", "32630470") },
            { @"Function App\Configuring and Managing Function Apps\VNET or Hybrid Connection", new Tuple<string, string>("16072", "32630473") },
            { @"Function App\Creating Function Apps", new Tuple<string, string>("16072", "32518043") },
            { @"Function App\Deploying Function Apps", new Tuple<string, string>("16072", "32598330") },
{ @"Function App\Deploying Function Apps\ARM Templates        ", new Tuple<string, string>("16072", "32630462") },
            { @"Function App\Deploying Function Apps\Deploy from GIT repo", new Tuple<string, string>("16072", "32630464") },
            { @"Function App\Deploying Function Apps\Visual Studio", new Tuple<string, string>("16072", "32630472") },
            { @"Function App\Developing Functions", new Tuple<string, string>("16072", "32518044") },
            { @"Function App\Durable Functions", new Tuple<string, string>("16072", "32607512") },
            { @"Function App\Durable Functions\Creation        ", new Tuple<string, string>("16072", "32607518") },
            { @"Function App\Durable Functions\Monitoring", new Tuple<string, string>("16072", "32630477") },
            { @"Function App\Durable Functions\Performance", new Tuple<string, string>("16072", "32630478") },
            { @"Function App\General Guidance or Advisory", new Tuple<string, string>("16072", "32592925") },
            { @"Function App\Monitoring", new Tuple<string, string>("16072", "32598332") },
            { @"Function App\Performance", new Tuple<string, string>("16072", "32630469") },
            { @"Function App\Performance\Functions scaling issues", new Tuple<string, string>("16072", "32630474") },
            { @"Function App\Performance\HTTP Functions Scaling", new Tuple<string, string>("16072", "32630475") },
            { @"Function App\Performance\Message Functions processing latency", new Tuple<string, string>("16072", "32630476") },
            { @"Function App\Portal Issues", new Tuple<string, string>("16072", "32518045") },
            { @"Logic App", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Advisory", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Connectivity - On-Premises Data Gateway", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Connector Issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Connector Issues\Authentication issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Connector Issues\Connector failures", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Deployment", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Deployment\ARM deployment", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Deployment\Issues with creation and deletion", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Deployment\Visual Studio deployment", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Errors and Other Application Issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Errors and Other Application Issues\Action failures", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Errors and Other Application Issues\Designer issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Errors and Other Application Issues\Trigger failures", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues\Configuration and management", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues\Enterprise Integration Pack", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues\Logic Apps SDK", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues\Other", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\How-To or Development Issues\Setting up authentication and permissions", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Monitoring Issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Monitoring Issues\Alerts and metrics", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Monitoring Issues\Azure Monitor", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Monitoring Issues\OMS issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Monitoring Issues\Other", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Performance", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Performance\Other", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Performance\Slow performance", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Performance\Throttling and quotas", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Security Issues", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Logic App\Service Interruption Notified by Azure Portal", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Windows)", new Tuple<string, string>("14748", "32542218") },
            { @"Web App (Windows)\Advisory", new Tuple<string, string>("14748", "32542218") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues", new Tuple<string, string>("14748", "32440119") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Remote debugging", new Tuple<string, string>("14748", "32581620") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Web app down or reporting errors", new Tuple<string, string>("14748", "32542218") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Web app experiencing high CPU", new Tuple<string, string>("14748", "32583701") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Web app experiencing high memory usage", new Tuple<string, string>("14748", "32581616") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Web app restarted", new Tuple<string, string>("14748", "32570954") },
            { @"Web App (Windows)\Availability, Performance, and Application Issues\Web app slow", new Tuple<string, string>("14748", "32457411") },
            { @"Web App (Windows)\Configuration and Management", new Tuple<string, string>("14748", "32440115") },
            { @"Web App (Windows)\Configuration and Management\Authentication and authorization", new Tuple<string, string>("14748", "32542208") },
            { @"Web App (Windows)\Configuration and Management\Backup and Restore", new Tuple<string, string>("14748", "32542208") },
            { @"Web App (Windows)\Configuration and Management\Configuring custom domain names", new Tuple<string, string>("14748", "32440122") },
            { @"Web App (Windows)\Configuration and Management\Configuring hybrid connections with App Service", new Tuple<string, string>("14748", "32581613") },
            { @"Web App (Windows)\Configuration and Management\Configuring SSL", new Tuple<string, string>("14748", "32440123") },
            { @"Web App (Windows)\Configuration and Management\Configuring Traffic Manager with App Service", new Tuple<string, string>("14748", "32581614") },
            { @"Web App (Windows)\Configuration and Management\Creating or deleting resources", new Tuple<string, string>("14748", "32542209") },
            { @"Web App (Windows)\Configuration and Management\Deployment slots (create, swap, and so on)", new Tuple<string, string>("14748", "32581615") },
            { @"Web App (Windows)\Configuration and Management\IP configuration", new Tuple<string, string>("14748", "32542210") },
            { @"Web App (Windows)\Configuration and Management\Metrics are not available or are incorrect", new Tuple<string, string>("14748", "32581617") },
            { @"Web App (Windows)\Configuration and Management\Moving resources", new Tuple<string, string>("14748", "32581619") },
            { @"Web App (Windows)\Configuration and Management\Scaling", new Tuple<string, string>("14748", "32542211") },
            { @"Web App (Windows)\Configuration and Management\VNET integration with App Service", new Tuple<string, string>("14748", "32542212") },
            { @"Web App (Windows)\Deployment", new Tuple<string, string>("14748", "32440116") },
            { @"Web App (Windows)\Deployment\ARM template", new Tuple<string, string>("14748", "32581628") },
            { @"Web App (Windows)\Deployment\FTP", new Tuple<string, string>("14748", "32542213") },
            { @"Web App (Windows)\Deployment\Git, GitHub, BitBucket, Dropbox", new Tuple<string, string>("14748", "32542214") },
            { @"Web App (Windows)\Deployment\Other", new Tuple<string, string>("14748", "32542215") },
            { @"Web App (Windows)\Deployment\Visual Studio", new Tuple<string, string>("14748", "32588774") },
            { @"Web App (Windows)\How Do I", new Tuple<string, string>("14748", "32589274") },
            { @"Web App (Windows)\How Do I\Configure and manage App Service Environment (ASE)", new Tuple<string, string>("14748", "32589275") },
            { @"Web App (Windows)\How Do I\Configure backup and restore", new Tuple<string, string>("14748", "32589276") },
            { @"Web App (Windows)\How Do I\Configure domains and certificates", new Tuple<string, string>("14748", "32589277") },
            { @"Web App (Windows)\How Do I\Configure VNET, hybrid connections, or Traffic Manager", new Tuple<string, string>("14748", "32589278") },
            { @"Web App (Windows)\How Do I\Create, delete, or move resources", new Tuple<string, string>("14748", "32589279") },
            { @"Web App (Windows)\How Do I\How to use authentication and authorization in my app", new Tuple<string, string>("14748", "supportTopicId") },
            { @"Web App (Windows)\How Do I\IP configuration", new Tuple<string, string>("14748", "32589281") },
            { @"Web App (Windows)\How Do I\Publish code to a web app", new Tuple<string, string>("14748", "32589282") },
            { @"Web App (Windows)\How Do I\Scale a web app", new Tuple<string, string>("14748", "32589283") },
            { @"Web App (Windows)\Malware, Virus, or Security Intrusion", new Tuple<string, string>("14748", "32440118") },
            { @"Web App (Windows)\Open Source Technologies", new Tuple<string, string>("14748", "32444076") },
            { @"Web App (Windows)\Open Source Technologies\ClearDB", new Tuple<string, string>("14748", "32550703") },
            { @"Web App (Windows)\Open Source Technologies\Java", new Tuple<string, string>("14748", "32444081") },
            { @"Web App (Windows)\Open Source Technologies\MySQL in App", new Tuple<string, string>("14748", "32444077") },
            { @"Web App (Windows)\Open Source Technologies\node.js", new Tuple<string, string>("14748", "32444082") },
            { @"Web App (Windows)\Open Source Technologies\PHP", new Tuple<string, string>("14748", "32444083") },
            { @"Web App (Windows)\Open Source Technologies\Python", new Tuple<string, string>("14748", "32444084") },
            { @"Web App (Windows)\Open Source Technologies\WordPress", new Tuple<string, string>("14748", "32444080") },
            { @"Web App (Windows)\Problems with ASE", new Tuple<string, string>("14748", "32581605") },
            { @"Web App (Windows)\Problems with ASE\ASE configuration and management", new Tuple<string, string>("14748", "32581605") },
            { @"Web App (Windows)\Problems with ASE\ASE creation", new Tuple<string, string>("14748", "32581605") },
            { @"Web App (Windows)\Problems with ASE\ASE is unavailable or unhealthy", new Tuple<string, string>("14748", "32581605") },
            { @"Web App (Windows)\Problems with WebJobs", new Tuple<string, string>("14748", "32581606") },
            { @"Web App (Windows)\Problems with WebJobs\Cannot create WebJobs", new Tuple<string, string>("14748", "32581610") },
            { @"Web App (Windows)\Problems with WebJobs\WebJobs is crashing, failing, or stopping", new Tuple<string, string>("14748", "32581611") },
            { @"Web App (Windows)\Problems with WebJobs\WebJobs SDK", new Tuple<string, string>("14748", "32581611") },
            { @"Web App (Linux)", new Tuple<string, string>("16170", "32542218") },
            { @"Web App (Linux)\Advisory", new Tuple<string, string>("16170", "32542218") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues", new Tuple<string, string>("16170", "32440119") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Remote debugging", new Tuple<string, string>("16170", "32581620") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Web app down or reporting errors", new Tuple<string, string>("16170", "32542218") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Web app experiencing high CPU", new Tuple<string, string>("16170", "32583701") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Web app experiencing high memory usage", new Tuple<string, string>("16170", "32581616") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Web app restarted", new Tuple<string, string>("16170", "32570954") },
            { @"Web App (Linux)\Availability, Performance, and Application Issues\Web app slow", new Tuple<string, string>("16170", "32457411") },
            { @"Web App (Linux)\Configuration and Management", new Tuple<string, string>("16170", "32440115") },
            { @"Web App (Linux)\Configuration and Management\Authentication and authorization", new Tuple<string, string>("16170", "32542208") },
            { @"Web App (Linux)\Configuration and Management\Backup and Restore", new Tuple<string, string>("16170", "32542208") },
            { @"Web App (Linux)\Configuration and Management\Configuring custom domain names", new Tuple<string, string>("16170", "32440122") },
            { @"Web App (Linux)\Configuration and Management\Configuring hybrid connections with App Service", new Tuple<string, string>("16170", "32581613") },
            { @"Web App (Linux)\Configuration and Management\Configuring SSL", new Tuple<string, string>("16170", "32440123") },
            { @"Web App (Linux)\Configuration and Management\Configuring Traffic Manager with App Service", new Tuple<string, string>("16170", "32581614") },
            { @"Web App (Linux)\Configuration and Management\Creating or deleting resources", new Tuple<string, string>("16170", "32542209") },
            { @"Web App (Linux)\Configuration and Management\Deployment slots (create, swap, and so on)", new Tuple<string, string>("16170", "32581615") },
            { @"Web App (Linux)\Configuration and Management\IP configuration", new Tuple<string, string>("16170", "32542210") },
            { @"Web App (Linux)\Configuration and Management\Metrics are not available or are incorrect", new Tuple<string, string>("16170", "32581617") },
            { @"Web App (Linux)\Configuration and Management\Moving resources", new Tuple<string, string>("16170", "32581619") },
            { @"Web App (Linux)\Configuration and Management\Scaling", new Tuple<string, string>("16170", "32542211") },
            { @"Web App (Linux)\Configuration and Management\VNET integration with App Service", new Tuple<string, string>("16170", "32542212") },
            { @"Web App (Linux)\Deployment", new Tuple<string, string>("16170", "32440116") },
            { @"Web App (Linux)\Deployment\ARM template", new Tuple<string, string>("16170", "32581628") },
            { @"Web App (Linux)\Deployment\FTP", new Tuple<string, string>("16170", "32542213") },
            { @"Web App (Linux)\Deployment\Git, GitHub, BitBucket, Dropbox", new Tuple<string, string>("16170", "32542214") },
            { @"Web App (Linux)\Deployment\Other", new Tuple<string, string>("16170", "32542215") },
            { @"Web App (Linux)\Deployment\Visual Studio", new Tuple<string, string>("16170", "32588774") },
            { @"Web App (Linux)\Malware, Virus, or Security Intrusion", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\ClearDB", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\Java", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\node.js", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\PHP", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\Python", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\Ruby on Rails", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"Web App (Linux)\Open Source Technologies\WordPress", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"App Service Certificates", new Tuple<string, string>("pesId", "supportTopicId") },
            { @"App Service Domains", new Tuple<string, string>("pesId", "supportTopicId") },
        };
    }
}
