#This script is to forward github PR to OneBranch, removed once fully migrated to OneBranch
$branchName = Read-Host "Enter the branch name you want to pull from github, default is main"
IF ([string]::IsNullOrWhitespace($branchName)) {
    $branchName = "main"
}
"Branch pulling from github is " + $branchName
$createdBranchName = Read-Host "Enter the branch name you want to create in OneBranch, default is $branchName"
IF ([string]::IsNullOrWhitespace($createdBranchName)) {
    $createdBranchName = $branchName
}
"Branch creating in OneBranch is " + $createdBranchName


git fetch origin main
git checkout -b $createdBranchName origin/main

git remote add github https://github.com/Azure/Azure-AppServices-Diagnostics-Portal.git
git fetch github $branchName
git merge -X theirs github/$branchName

"Pushing branch " + $createdBranchName + " to remote"
git push -u origin $createdBranchName
git remote remove github