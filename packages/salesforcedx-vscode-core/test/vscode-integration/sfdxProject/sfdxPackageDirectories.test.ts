import { expect } from 'chai';
import { SinonStub, stub } from 'sinon';
import {
  SfdxPackageDirectories,
  SfdxProjectConfig,
  SfdxProjectPath
} from '../../../src/sfdxProject';

import * as path from 'path';

const PROJECT_PATH = path.join('sfdx', 'project', 'path');

/* tslint:disable:no-unused-expression */
describe('SFDX Package Directories', () => {
  describe('getPackageDirectoryPaths', () => {
    let sfdxProjectConfigStub: SinonStub;
    afterEach(() => {
      sfdxProjectConfigStub.restore();
    });
    it('should return one package directory', async () => {
      sfdxProjectConfigStub = stub(SfdxProjectConfig, 'getValue').returns([
        { path: 'force-app' }
      ]);
      expect(await SfdxPackageDirectories.getPackageDirectoryPaths()).to.eql([
        'force-app'
      ]);
    });

    it('should return multiple package directories', async () => {
      sfdxProjectConfigStub = stub(SfdxProjectConfig, 'getValue').returns([
        { path: 'package1' },
        { path: 'package2' },
        { path: 'package3' }
      ]);
      expect(await SfdxPackageDirectories.getPackageDirectoryPaths()).to.eql([
        'package1',
        'package2',
        'package3'
      ]);
    });

    it('should trim whitespace and remove leading slashes from package directories', async () => {
      sfdxProjectConfigStub = stub(SfdxProjectConfig, 'getValue').returns([
        { path: '   package1   ' },
        { path: `${path.sep}package2` },
        { path: path.join('package', 'three') }
      ]);
      expect(await SfdxPackageDirectories.getPackageDirectoryPaths()).to.eql([
        'package1',
        'package2',
        path.join('package', 'three')
      ]);
    });

    it('should throw an error if no package directories are found in the sfdx-project.json', async () => {
      sfdxProjectConfigStub = stub(SfdxProjectConfig, 'getValue').returns(
        undefined
      );
      let errorWasThrown = false;
      try {
        await SfdxPackageDirectories.getPackageDirectoryPaths();
      } catch (error) {
        errorWasThrown = true;
        expect(error.name).to.equal('NoPackageDirectoriesFound');
      } finally {
        expect(errorWasThrown).to.be.true;
      }
    });

    it('should throw an error if packageDirectories does not specify any paths', async () => {
      sfdxProjectConfigStub = stub(SfdxProjectConfig, 'getValue').returns([]);
      let errorWasThrown = false;
      try {
        await SfdxPackageDirectories.getPackageDirectoryPaths();
      } catch (error) {
        errorWasThrown = true;
        expect(error.name).to.equal('NoPackageDirectoryPathsFound');
      } finally {
        expect(errorWasThrown).to.be.true;
      }
    });
  });

  describe('getPackageDirectoryFullPaths', () => {
    let sfdxProjectPathStub: SinonStub;
    beforeEach(() => {
      sfdxProjectPathStub = stub(SfdxProjectPath, 'getPath').returns(
        PROJECT_PATH
      );
    });

    afterEach(() => {
      sfdxProjectPathStub.restore();
    });

    it('should append the project path to the package directory path', async () => {
      const getPackageDirectoryPathsStub = stub(
        SfdxPackageDirectories,
        'getPackageDirectoryPaths'
      ).returns(['package1', 'package2']);
      const fullPaths = await SfdxPackageDirectories.getPackageDirectoryFullPaths();
      expect(fullPaths.length).to.equal(2);
      expect(fullPaths[0]).to.equal(path.join(PROJECT_PATH, 'package1'));
      expect(fullPaths[1]).to.equal(path.join(PROJECT_PATH, 'package2'));
      getPackageDirectoryPathsStub.restore();
    });
  });

  describe('isInPackageDirectory', () => {
    let getPackageDirectoryFullPathsStub: SinonStub;
    afterEach(() => {
      getPackageDirectoryFullPathsStub.restore();
    });
    it('should return true if the filePath is the path to a package directory', async () => {
      const packagePath = path.join(PROJECT_PATH, 'force-app');
      getPackageDirectoryFullPathsStub = stub(
        SfdxPackageDirectories,
        'getPackageDirectoryFullPaths'
      ).returns([packagePath]);

      expect(await SfdxPackageDirectories.isInPackageDirectory(packagePath)).to
        .be.true;
    });

    it('should return true if the filePath is one of several package directories', async () => {
      const packagePath1 = path.join(PROJECT_PATH, 'force-app');
      const packagePath2 = path.join(PROJECT_PATH, 'another-app');
      const packagePath3 = path.join(PROJECT_PATH, 'a-third-app');
      getPackageDirectoryFullPathsStub = stub(
        SfdxPackageDirectories,
        'getPackageDirectoryFullPaths'
      ).returns([packagePath1, packagePath2, packagePath3]);
      const filePath = path.join(
        packagePath2,
        'main',
        'default',
        'classes',
        'TestClass.cls'
      );
      expect(await SfdxPackageDirectories.isInPackageDirectory(filePath)).to.be
        .true;
    });
  });
});