#This script is to forward github PR to OneBranch, removed once fully migrated to OneBranch
$dateTime = Get-Date
$userName = git config user.name
$branchName = $userName + "/ff-" + $dateTime.ToString("MM-dd")
$branchName = $branchName.ToLower()
git checkout -b $branchName
git remote add github https://github.com/Azure/Azure-AppServices-Diagnostics-Portal.git
git pull
git pull github
git merge -X theirs github/main
"Pushing branch " + $branchName + " to remote"
git push -u origin $branchName
git remote remove github
