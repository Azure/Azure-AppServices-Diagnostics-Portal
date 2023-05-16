using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;

namespace UITestUtilities
{
    public class JsonFileTestDataAttribute<T> : Attribute, ITestDataSource where T : class
    {
        private Dictionary<string, T> _data;

        public JsonFileTestDataAttribute(string filePath)
        {
            var path = Path.IsPathRooted(filePath) ? filePath : Path.GetRelativePath(Directory.GetCurrentDirectory(), filePath);


            if (!File.Exists(path))
            {
                throw new ArgumentException($"Could not find file at path: {path}");
            }

            var fileData = File.ReadAllText(filePath);
            _data = JObject.Parse(fileData).ToObject<Dictionary<string, T>>();
        }


        public IEnumerable<object[]> GetData(MethodInfo methodInfo)
        {

            foreach (var entry in _data)
            {
                yield return new object[] { entry.Key, entry.Value };
            }
        }

        public string GetDisplayName(MethodInfo methodInfo, object[] data)
        {
            if (data != null)
            {
                return string.Format("{0}({1})", methodInfo.Name, data[0]);
            }
            return null;
        }
    }
}
